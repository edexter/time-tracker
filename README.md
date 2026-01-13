# Time Tracker

A single-user web application for tracking consulting time across clients and projects.

## Features

- Track total hours worked per day via clock in/out sessions
- Allocate worked hours to specific projects (15-minute increments)
- Generate billing summaries by client/project
- Monitor time budgets at client and project levels
- Track non-billable work

## Tech Stack

- **Backend:** Python 3.11+, Flask, PostgreSQL
- **Frontend:** React 18+, Tailwind CSS
- **Deployment:** Docker, Render

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Node.js 18+

### Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd time_tracking
```

2. **Generate password hash**

```bash
python scripts/generate_password_hash.py
```

Add the generated hash to your `.env` file.

3. **Start the application**

```bash
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api
- Database: localhost:5432

### Development

**Backend development:**
```bash
cd backend
pip install -r requirements.txt
flask db upgrade
flask run
```

**Frontend development:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```
SECRET_KEY=your-secret-key
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:postgres@db:5432/timetracker
PASSWORD_HASH=your-bcrypt-hash
```

## Project Structure

```
time_tracking/
├── backend/          # Flask backend
│   ├── models/       # SQLAlchemy models
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   └── middleware/   # Auth middleware
├── frontend/         # React frontend
│   └── src/
│       ├── api/      # API client
│       ├── components/
│       ├── pages/
│       └── hooks/
└── scripts/          # Utility scripts
```

## License

Private project - All rights reserved
