# Time Tracker

A single-user web application for tracking consulting time across clients and projects.

## Features

- Clock in/out to track daily work sessions
- Allocate hours to projects with optional notes
- Multi-currency support (CHF, EUR)
- Budget tracking at client and project levels
- Billing summaries and reports by date range

## Tech Stack

- **Backend:** Python 3.11, Flask, SQLAlchemy, PostgreSQL
- **Frontend:** React 18, TypeScript, Tailwind CSS, TanStack Query
- **Deployment:** Docker, Render

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Docker)

### Setup

1. **Clone and configure**

```bash
git clone <repository-url>
cd time_tracking
cp .env.example .env
```

2. **Generate password hash**

```bash
python scripts/generate_password_hash.py
```

Add the generated hash to `.env` as `PASSWORD_HASH`.

3. **Backend setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. **Frontend setup**

```bash
cd frontend
npm install
```

5. **Start dev servers**

```bash
# From project root, start both servers:
# Backend: http://localhost:5000
# Frontend: http://localhost:5173

# Terminal 1 - Backend
source backend/venv/bin/activate && FLASK_APP=backend.app flask run --host=0.0.0.0 --port=5000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## Environment Variables

Create `.env` in project root:

```
SECRET_KEY=your-secret-key
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timetracker
PASSWORD_HASH=your-bcrypt-hash
```

## Project Structure

```
time_tracking/
├── backend/
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   └── utils/           # Datetime utilities
├── frontend/
│   └── src/
│       ├── api/         # API client (TypeScript)
│       ├── components/  # React components
│       ├── hooks/       # React Query hooks
│       ├── pages/       # Page components
│       └── types/       # TypeScript definitions
├── migrations/          # Alembic migrations
└── scripts/             # Utility scripts
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker and Render deployment instructions.

## License

Private project - All rights reserved
