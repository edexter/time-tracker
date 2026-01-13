#!/bin/bash

# Time Tracker - Local Development Script
# Fast iteration with auto-reload for backend and frontend

set -e

echo "🚀 Starting Time Tracker Local Development Environment"
echo "======================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with required variables (see .env.example)"
    exit 1
fi

source .env

# Check if PASSWORD_HASH is set
if [ -z "$PASSWORD_HASH" ]; then
    echo "❌ Error: PASSWORD_HASH not set in .env"
    echo "Run: python scripts/generate_password_hash.py"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${BLUE}📋 Checking dependencies...${NC}"

if ! command_exists python3; then
    echo "❌ Python 3 not found. Please install Python 3.11+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Node.js/npm not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists docker-compose && ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"

# Start PostgreSQL in Docker
echo -e "\n${BLUE}🐘 Starting PostgreSQL...${NC}"
docker-compose up -d db

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 3

# Check if PostgreSQL is responding
until docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# Setup backend virtual environment
echo -e "\n${BLUE}🐍 Setting up Python backend...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install/update Python dependencies
if [ ! -f "venv/.installed" ] || [ requirements.txt -nt venv/.installed ]; then
    echo "Installing Python dependencies..."
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    touch venv/.installed
else
    echo "Python dependencies already installed"
fi

# Initialize database if needed
cd "$PROJECT_ROOT"
if [ ! -d "backend/migrations" ]; then
    echo "Initializing database migrations..."
    export FLASK_APP=backend/app.py
    export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
    flask db init
    flask db migrate -m "Initial migration"
    flask db upgrade
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo "Running pending migrations..."
    export FLASK_APP=backend/app.py
    export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"
    flask db upgrade 2>/dev/null || echo "No pending migrations"
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Setup frontend
echo -e "\n${BLUE}⚛️  Setting up React frontend...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.installed ]; then
    echo "Installing Node dependencies..."
    npm install
    touch node_modules/.installed
else
    echo "Node dependencies already installed"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Create log directory
mkdir -p "$PROJECT_ROOT/logs"

# Start backend and frontend
echo -e "\n${YELLOW}🎬 Starting development servers...${NC}"
echo "======================================================"
echo -e "${GREEN}Backend:${NC}  http://localhost:5000"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}Database:${NC} localhost:5432"
echo "======================================================"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
    echo -e "\n\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    docker-compose stop db
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# Start backend
cd "$PROJECT_ROOT"
source backend/venv/bin/activate
export FLASK_APP=backend/app.py
export FLASK_ENV=development
export FLASK_DEBUG=1
export DATABASE_URL=${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/timetracker}
export PYTHONPATH="$PROJECT_ROOT:$PYTHONPATH"

echo -e "${BLUE}Starting Flask backend...${NC}"
flask run --host=0.0.0.0 --port=5000 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
cd "$PROJECT_ROOT/frontend"
echo -e "${BLUE}Starting Vite frontend...${NC}"
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo -e "\n${GREEN}✓ All services running!${NC}"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""

# Show logs in real-time
tail -f "$PROJECT_ROOT/logs/backend.log" "$PROJECT_ROOT/logs/frontend.log" 2>/dev/null &
TAIL_PID=$!

# Wait for user to press Ctrl+C
wait
