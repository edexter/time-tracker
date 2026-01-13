# Time Tracking Application — Build Specification

## Project Overview

A single-user web application for tracking consulting time across clients and projects. Built for a solo data science consultancy to track billable hours and generate data for invoicing.

### Primary Goals

1. Track total hours worked per day via clock in/out sessions
2. Allocate worked hours to specific projects (in 15-minute increments)
3. Generate billing summaries by client/project for manual invoicing
4. Monitor time budgets at client and project levels
5. Track non-billable work (admin, business development, learning)

### Tech Stack

- **Backend:** Python 3.11+, Flask
- **Frontend:** React 18+, Tailwind CSS
- **Database:** PostgreSQL
- **Containerisation:** Docker
- **Deployment:** Render (paid tier, always-on)

---

## 1. Authentication System

### Requirements

- Single user only
- Password-based authentication with session cookies
- Password hash stored in environment variable (never in code or database)
- Session duration: 7 days
- Secure cookies (HTTPS-only, HTTP-only flag)

### Brute Force Protection

- Rate limiting: 5 login attempts per minute per IP (use Flask-Limiter)
- Account lockout: 10 failed attempts triggers 30-minute lockout
- Store failed attempt count in database (persists across restarts)

### Implementation Details

```python
# Password hash generation (run once locally, store result in env var)
import bcrypt
password = b"user-password-here"
hash = bcrypt.hashpw(password, bcrypt.gensalt())
print(hash.decode())  # Store as PASSWORD_HASH env var
```

**Environment variables required:**
- `SECRET_KEY` — Flask session secret (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- `PASSWORD_HASH` — bcrypt hash of user password
- `DATABASE_URL` — PostgreSQL connection string (provided by Render)

### Login Flow

1. User visits any route → middleware checks session
2. No valid session → redirect to `/login`
3. User submits password → backend verifies against hash
4. Success → create session, redirect to daily tracker
5. Failure → increment failed attempts, return error

### Endpoints

```
POST /api/auth/login
  Body: { "password": "string" }
  Success: 200, sets session cookie
  Failure: 401 { "error": "Invalid password" } or 429 if rate limited

POST /api/auth/logout
  Success: 200, clears session cookie

GET /api/auth/me
  Success: 200 { "authenticated": true }
  Failure: 401 { "authenticated": false }
```

---

## 2. Database Schema

### 2.1 Clients Table

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('CHF', 'EUR')),
    default_hourly_rate DECIMAL(10, 2) NOT NULL,
    hour_budget DECIMAL(10, 2) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_active ON clients(is_active, is_archived);
```

### 2.2 Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    hourly_rate_override DECIMAL(10, 2) NULL,
    hour_budget DECIMAL(10, 2) NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_active ON projects(is_active, is_archived);
```

### 2.3 Work Sessions Table

```sql
CREATE TABLE work_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_date ON work_sessions(date);
```

**Notes:**
- `end_time` is NULL when session is active (user is clocked in)
- If a session spans midnight, automatically split into two sessions at midnight

### 2.4 Time Allocations Table

```sql
CREATE TABLE time_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id),
    hours DECIMAL(5, 2) NOT NULL CHECK (hours > 0 AND MOD(hours * 4, 1) = 0),
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_allocations_date ON time_allocations(date);
CREATE INDEX idx_allocations_project ON time_allocations(project_id);
```

**Notes:**
- Hours must be in 0.25 increments (15 minutes)
- The CHECK constraint ensures valid increments: `MOD(hours * 4, 1) = 0`

### 2.5 Login Attempts Table (for brute force protection)

```sql
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at);
```

---

## 3. API Specification

### 3.1 Authentication

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 3.2 Clients

```
GET /api/clients
  Query params: ?include_archived=true (default false)
  Response: {
    "clients": [
      {
        "id": "uuid",
        "name": "NNIT",
        "currency": "EUR",
        "default_hourly_rate": 85.00,
        "hour_budget": 100.00,
        "hours_logged": 45.25,
        "is_active": true,
        "is_archived": false,
        "created_at": "iso-timestamp",
        "updated_at": "iso-timestamp"
      }
    ]
  }

POST /api/clients
  Body: {
    "name": "string",
    "currency": "CHF" | "EUR",
    "default_hourly_rate": number,
    "hour_budget": number | null
  }
  Response: 201 { "client": {...} }

GET /api/clients/:id
  Response: { "client": {...} }

PUT /api/clients/:id
  Body: { partial client fields }
  Response: { "client": {...} }

PUT /api/clients/:id/archive
  Response: { "client": {...} }

PUT /api/clients/:id/restore
  Response: { "client": {...} }

DELETE /api/clients/:id
  Response: 204 (if no time logged) or 400 { "error": "Cannot delete client with logged time. Archive instead." }
```

### 3.3 Projects

```
GET /api/projects
  Query params: 
    ?client_id=uuid (optional filter)
    ?include_archived=true (default false)
  Response: {
    "projects": [
      {
        "id": "uuid",
        "client_id": "uuid",
        "client_name": "NNIT",
        "name": "Q1 Data Pipeline",
        "hourly_rate_override": null,
        "effective_hourly_rate": 85.00,
        "currency": "EUR",
        "hour_budget": 40.00,
        "hours_logged": 12.50,
        "is_active": true,
        "is_archived": false,
        "created_at": "iso-timestamp",
        "updated_at": "iso-timestamp"
      }
    ]
  }

POST /api/projects
  Body: {
    "client_id": "uuid",
    "name": "string",
    "hourly_rate_override": number | null,
    "hour_budget": number | null
  }
  Response: 201 { "project": {...} }

GET /api/projects/:id
  Response: { "project": {...} }

PUT /api/projects/:id
  Body: { partial project fields }
  Response: { "project": {...} }

PUT /api/projects/:id/archive
  Response: { "project": {...} }

PUT /api/projects/:id/restore
  Response: { "project": {...} }

DELETE /api/projects/:id
  Response: 204 (if no time logged) or 400 { "error": "Cannot delete project with logged time. Archive instead." }
```

### 3.4 Work Sessions

```
GET /api/sessions
  Query params: ?date=YYYY-MM-DD (required)
  Response: {
    "sessions": [
      {
        "id": "uuid",
        "date": "2024-01-15",
        "start_time": "iso-timestamp",
        "end_time": "iso-timestamp" | null,
        "duration_hours": 3.5,
        "is_active": false
      }
    ],
    "total_hours": 8.0,
    "active_session": null | { session object }
  }

POST /api/sessions/clock-in
  Body: { "time": "iso-timestamp" } (optional, defaults to now)
  Response: 201 { "session": {...} }
  Error: 400 if already clocked in

POST /api/sessions/clock-out
  Body: { "time": "iso-timestamp" } (optional, defaults to now)
  Response: { "session": {...} }
  Error: 400 if not clocked in

POST /api/sessions
  Body: {
    "date": "YYYY-MM-DD",
    "start_time": "iso-timestamp",
    "end_time": "iso-timestamp"
  }
  Response: 201 { "session": {...} }

PUT /api/sessions/:id
  Body: {
    "start_time": "iso-timestamp",
    "end_time": "iso-timestamp"
  }
  Response: { "session": {...} }

DELETE /api/sessions/:id
  Response: 204
  Note: Warn if this would make allocations exceed session time for the day
```

### 3.5 Time Allocations

```
GET /api/allocations
  Query params: ?date=YYYY-MM-DD (required)
  Response: {
    "allocations": [
      {
        "id": "uuid",
        "date": "2024-01-15",
        "project_id": "uuid",
        "project_name": "Q1 Data Pipeline",
        "client_name": "NNIT",
        "hours": 2.5,
        "notes": "Worked on data ingestion module",
        "created_at": "iso-timestamp"
      }
    ],
    "total_allocated": 7.0,
    "total_clocked": 8.0,
    "unallocated": 1.0
  }

POST /api/allocations
  Body: {
    "date": "YYYY-MM-DD",
    "project_id": "uuid",
    "hours": number (0.25 increments),
    "notes": "string" | null
  }
  Response: 201 { "allocation": {...} }
  Error: 400 if allocation would exceed clocked time for date

PUT /api/allocations/:id
  Body: { partial allocation fields }
  Response: { "allocation": {...} }
  Error: 400 if allocation would exceed clocked time for date

DELETE /api/allocations/:id
  Response: 204
```

### 3.6 Reports

```
GET /api/reports/summary
  Query params:
    ?start_date=YYYY-MM-DD (required)
    ?end_date=YYYY-MM-DD (required)
    ?client_id=uuid (optional, filter to single client)
  Response: {
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    },
    "by_currency": {
      "EUR": {
        "clients": [
          {
            "id": "uuid",
            "name": "NNIT",
            "currency": "EUR",
            "projects": [
              {
                "id": "uuid",
                "name": "Q1 Data Pipeline",
                "hours": 12.50,
                "hourly_rate": 85.00,
                "amount": 1062.50
              }
            ],
            "total_hours": 20.75,
            "total_amount": 1763.75
          }
        ],
        "total_hours": 52.75,
        "total_amount": 4643.75
      },
      "CHF": {
        "clients": [...],
        "total_hours": 15.00,
        "total_amount": 1350.00
      }
    },
    "grand_total_hours": 67.75
  }

GET /api/reports/daily-summary
  Query params:
    ?start_date=YYYY-MM-DD (required)
    ?end_date=YYYY-MM-DD (required)
  Response: {
    "days": [
      {
        "date": "2024-01-15",
        "total_clocked": 8.0,
        "total_allocated": 7.5,
        "unallocated": 0.5,
        "has_unallocated": true
      }
    ]
  }
```

### 3.7 Calendar Data

```
GET /api/calendar
  Query params:
    ?year=2024 (required)
    ?month=1 (required, 1-12)
  Response: {
    "days": [
      {
        "date": "2024-01-15",
        "has_sessions": true,
        "has_unallocated": true,
        "total_hours": 8.0,
        "unallocated_hours": 0.5
      }
    ]
  }
```

---

## 4. Frontend Structure

### 4.1 Pages and Routes

```
/login                  - Login page
/                       - Daily tracker (redirects to /day/today)
/day/:date              - Daily tracker for specific date (YYYY-MM-DD or "today")
/calendar               - Calendar month view
/clients                - Client list and management
/clients/:id            - Client detail/edit
/projects               - Project list and management
/projects/:id           - Project detail/edit
/reports                - Reporting and summaries
```

### 4.2 Component Hierarchy

```
App
├── AuthProvider (context for auth state)
├── ProtectedRoute (wrapper that checks auth)
│
├── Layout
│   ├── Header
│   │   ├── AppTitle
│   │   ├── CurrentDate
│   │   └── LogoutButton
│   ├── Sidebar
│   │   ├── NavLink (Today)
│   │   ├── NavLink (Calendar)
│   │   ├── NavLink (Clients)
│   │   ├── NavLink (Projects)
│   │   └── NavLink (Reports)
│   └── MainContent (outlet for routes)
│
├── Pages
│   ├── LoginPage
│   │   └── LoginForm
│   │
│   ├── DailyTrackerPage
│   │   ├── TimerControl
│   │   │   ├── ClockInButton
│   │   │   ├── ClockOutButton
│   │   │   └── ActiveSessionDisplay
│   │   ├── SessionsList
│   │   │   └── SessionRow (editable)
│   │   ├── DailySummary
│   │   │   ├── TotalClockedDisplay
│   │   │   ├── TotalAllocatedDisplay
│   │   │   └── UnallocatedWarning
│   │   ├── AllocationsList
│   │   │   └── AllocationRow (editable)
│   │   └── AddAllocationForm
│   │       ├── ProjectDropdown
│   │       ├── HoursInput (0.25 step)
│   │       └── NotesInput
│   │
│   ├── CalendarPage
│   │   ├── MonthNavigation
│   │   ├── CalendarGrid
│   │   │   └── DayCell (clickable, shows indicators)
│   │   └── DateNavigator
│   │
│   ├── ClientsPage
│   │   ├── ClientsList
│   │   │   ├── ClientRow
│   │   │   │   ├── BudgetProgressBar
│   │   │   │   └── ActionButtons (edit, archive, delete)
│   │   │   └── ShowArchivedToggle
│   │   └── ClientForm (modal or inline)
│   │
│   ├── ProjectsPage
│   │   ├── ClientFilter
│   │   ├── ProjectsList
│   │   │   ├── ProjectRow
│   │   │   │   ├── BudgetProgressBar
│   │   │   │   └── ActionButtons
│   │   │   └── ShowArchivedToggle
│   │   └── ProjectForm (modal or inline)
│   │
│   └── ReportsPage
│       ├── DateRangePicker
│       ├── ClientFilter
│       └── ReportSummary
│           ├── CurrencySection (one per currency)
│           │   ├── ClientSummary
│           │   │   └── ProjectLine
│           │   └── CurrencyTotal
│           └── GrandTotal
│
└── Shared Components
    ├── Modal
    ├── ConfirmDialog
    ├── Button
    ├── Input
    ├── Select
    ├── NumberStepper (for 0.25 hour increments)
    ├── DatePicker
    ├── ProgressBar
    ├── Badge
    └── LoadingSpinner
```

### 4.3 State Management

Use React Query for server state:
- Queries: clients, projects, sessions, allocations, calendar data, reports
- Mutations: create/update/delete operations
- Auto-refetch on window focus
- Optimistic updates for better UX

Local state with useState/useContext for:
- Auth state
- UI state (modals open, filters selected)
- Active timer display (poll or websocket)

### 4.4 Key UI Behaviours

**Timer Control:**
- Show prominent "Clock In" button when not clocked in
- When clocked in, show running duration (update every second) and "Clock Out" button
- Duration format: "2h 34m" or "2:34"

**Hours Input:**
- Use number input with step=0.25
- Or custom stepper component: [-] [2.50] [+]
- Buttons adjust by 0.25

**Project Dropdown (for allocations):**
- Group by client
- Show only active projects from active clients
- Display remaining budget next to project name if budget is set
- Format: "Project Name (12.5h remaining)" or "Project Name (over budget!)"

**Budget Progress Bars:**
- Green: 0-79% of budget used
- Amber: 80-99% of budget used
- Red: 100%+ of budget used
- Show "No budget set" if null

**Unallocated Time Warning:**
- Prominent display on daily tracker: "1.5 hours unallocated"
- Calendar day cells: orange dot indicator for days with unallocated time
- Consider subtle colour on sidebar "Today" link if today has unallocated time

**Delete Confirmation:**
- Modal dialog: "Are you sure you want to permanently delete [Client/Project Name]? This cannot be undone."
- Two buttons: "Cancel" (secondary) and "Delete" (danger/red)
- Only allowed if no time has been logged against the item

---

## 5. Project File Structure

```
time-tracker/
├── docker-compose.yml
├── Dockerfile
├── README.md
│
├── backend/
│   ├── requirements.txt
│   ├── config.py
│   ├── app.py                    # Flask app factory
│   ├── extensions.py             # Flask extensions (db, limiter, etc.)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── client.py
│   │   ├── project.py
│   │   ├── work_session.py
│   │   ├── time_allocation.py
│   │   └── login_attempt.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── clients.py
│   │   ├── projects.py
│   │   ├── sessions.py
│   │   ├── allocations.py
│   │   ├── reports.py
│   │   └── calendar.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py       # Password verification, rate limiting
│   │   ├── time_service.py       # Business logic for time calculations
│   │   └── report_service.py     # Report generation logic
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth_middleware.py    # Session check decorator
│   │
│   └── migrations/               # Flask-Migrate/Alembic
│       └── versions/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css             # Tailwind imports
│   │   │
│   │   ├── api/
│   │   │   ├── client.js         # Axios/fetch wrapper
│   │   │   ├── auth.js
│   │   │   ├── clients.js
│   │   │   ├── projects.js
│   │   │   ├── sessions.js
│   │   │   ├── allocations.js
│   │   │   └── reports.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useClients.js
│   │   │   ├── useProjects.js
│   │   │   ├── useSessions.js
│   │   │   ├── useAllocations.js
│   │   │   └── useReports.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DailyTrackerPage.jsx
│   │   │   ├── CalendarPage.jsx
│   │   │   ├── ClientsPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   │
│   │   │   ├── tracker/
│   │   │   │   ├── TimerControl.jsx
│   │   │   │   ├── SessionsList.jsx
│   │   │   │   ├── SessionRow.jsx
│   │   │   │   ├── AllocationsList.jsx
│   │   │   │   ├── AllocationRow.jsx
│   │   │   │   ├── AddAllocationForm.jsx
│   │   │   │   └── DailySummary.jsx
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarGrid.jsx
│   │   │   │   ├── DayCell.jsx
│   │   │   │   └── MonthNavigation.jsx
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── ClientsList.jsx
│   │   │   │   ├── ClientRow.jsx
│   │   │   │   └── ClientForm.jsx
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── ProjectsList.jsx
│   │   │   │   ├── ProjectRow.jsx
│   │   │   │   └── ProjectForm.jsx
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── ReportSummary.jsx
│   │   │   │   ├── CurrencySection.jsx
│   │   │   │   └── DateRangePicker.jsx
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Modal.jsx
│   │   │       ├── ConfirmDialog.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Select.jsx
│   │   │       ├── NumberStepper.jsx
│   │   │       ├── ProgressBar.jsx
│   │   │       ├── Badge.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   └── utils/
│   │       ├── formatters.js     # Date, currency, duration formatting
│   │       └── validators.js
│   │
│   └── public/
│       └── favicon.ico
│
└── scripts/
    ├── generate_password_hash.py
    └── seed_data.py              # Optional: seed test data
```

---

## 6. Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/timetracker
      - SECRET_KEY=dev-secret-key-change-in-production
      - PASSWORD_HASH=${PASSWORD_HASH}
    depends_on:
      - db
    volumes:
      - ./backend:/app/backend
      - ./frontend:/app/frontend

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=timetracker
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend dependencies and build
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend/ .
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend/ backend/

# Move frontend build to static folder
RUN mkdir -p backend/static && cp -r frontend/dist/* backend/static/

ENV FLASK_APP=backend/app.py
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "backend.app:create_app()"]
```

---

## 7. Render Deployment Configuration

### render.yaml (Infrastructure as Code)

```yaml
services:
  - type: web
    name: time-tracker
    env: python
    plan: starter  # $7/month, always on
    buildCommand: |
      pip install -r backend/requirements.txt
      cd frontend && npm install && npm run build
      mkdir -p backend/static && cp -r frontend/dist/* backend/static/
    startCommand: gunicorn --bind 0.0.0.0:$PORT backend.app:create_app()
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: PASSWORD_HASH
        sync: false  # Set manually
      - key: DATABASE_URL
        fromDatabase:
          name: time-tracker-db
          property: connectionString

databases:
  - name: time-tracker-db
    plan: free  # Or starter for $7/month with more storage
```

---

## 8. Build Phases

### Phase 1: Project Foundation

1. **Initialise project structure**
   - Create directory structure as specified
   - Initialise git repository
   - Create docker-compose.yml and Dockerfile

2. **Backend setup**
   - Create Flask app factory (app.py)
   - Configure extensions (SQLAlchemy, Flask-Migrate, Flask-Limiter)
   - Create config.py with environment variable handling

3. **Database setup**
   - Create all SQLAlchemy models
   - Generate initial migration
   - Test database connection

4. **Frontend setup**
   - Initialise React with Vite
   - Configure Tailwind CSS
   - Set up React Router
   - Create basic Layout component

**Deliverable:** App runs locally with Docker, shows a placeholder page.

### Phase 2: Authentication

5. **Backend auth**
   - Implement login endpoint with bcrypt verification
   - Implement logout endpoint
   - Implement session check endpoint
   - Add rate limiting and lockout logic
   - Create auth middleware decorator

6. **Frontend auth**
   - Create AuthContext
   - Create LoginPage
   - Create ProtectedRoute component
   - Wire up auth flow

**Deliverable:** Can log in and out, protected routes redirect to login.

### Phase 3: Client and Project Management

7. **Backend CRUD**
   - Implement all client endpoints
   - Implement all project endpoints
   - Add archive/restore logic
   - Add delete protection (if time logged)

8. **Frontend pages**
   - Create ClientsPage with list and form
   - Create ProjectsPage with list and form
   - Add archive toggle
   - Add delete confirmation modal

**Deliverable:** Can create, edit, archive, and delete clients and projects.

### Phase 4: Time Tracking Core

9. **Backend sessions**
   - Implement work sessions endpoints
   - Handle clock in/out
   - Handle midnight split logic
   - Calculate daily totals

10. **Backend allocations**
    - Implement allocations endpoints
    - Add validation (cannot exceed clocked time)
    - Enforce 0.25 hour increments

11. **Frontend daily tracker**
    - Create TimerControl component
    - Create SessionsList with add/edit/delete
    - Create AllocationsList with add/edit/delete
    - Create DailySummary showing unallocated time
    - Create AddAllocationForm with project dropdown

**Deliverable:** Full daily time tracking workflow functional.

### Phase 5: Calendar and Navigation

12. **Backend calendar**
    - Implement calendar data endpoint

13. **Frontend calendar**
    - Create CalendarPage with month grid
    - Add visual indicators for logged/unallocated
    - Click to navigate to day

14. **Date navigation**
    - Add date parameter support to daily tracker
    - Add next/previous day navigation
    - Add "today" quick link

**Deliverable:** Can navigate to any date and see/edit time records.

### Phase 6: Reporting

15. **Backend reports**
    - Implement summary report endpoint
    - Group by currency, then client, then project
    - Calculate totals at each level

16. **Frontend reports**
    - Create ReportsPage
    - Create DateRangePicker
    - Create ReportSummary display
    - Add client filter

**Deliverable:** Can generate billing summaries for any date range.

### Phase 7: Budget Tracking

17. **Backend budget calculations**
    - Add hours_logged to client and project responses
    - Calculate percentage of budget used

18. **Frontend budget display**
    - Add ProgressBar component
    - Show budget status on client list
    - Show budget status on project list
    - Show remaining hours in allocation dropdown

**Deliverable:** Visual budget tracking throughout the app.

### Phase 8: Polish and Deployment

19. **UI refinement**
    - Consistent styling throughout
    - Loading states
    - Error handling and display
    - Empty states

20. **Testing**
    - Test auth flow edge cases
    - Test time validation rules
    - Test report calculations

21. **Deployment**
    - Create render.yaml
    - Deploy to Render
    - Configure environment variables
    - Test production deployment

**Deliverable:** Production-ready application running on Render.

---

## 9. Validation Rules Summary

| Rule | Enforcement |
|------|-------------|
| Hours in 0.25 increments | Database CHECK constraint + frontend step input |
| Allocations ≤ clocked time | Backend validation before save |
| Session end_time > start_time | Backend validation |
| Cannot delete client/project with time logged | Backend validation, return 400 |
| Password rate limiting | 5 attempts/minute/IP via Flask-Limiter |
| Account lockout | 10 failed attempts = 30 min lockout |
| Session duration | 7 days before re-authentication required |
| Currency valid values | Database CHECK constraint (CHF, EUR) |

---

## 10. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Flask session signing key | `a1b2c3d4e5...` (64 hex chars) |
| `PASSWORD_HASH` | bcrypt hash of user password | `$2b$12$...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `FLASK_ENV` | Environment mode | `development` or `production` |

---

## 11. Timezone Handling

- All timestamps stored in UTC in database
- Server assumes user timezone is `Europe/Zurich`
- Convert to local time for display
- Convert to UTC for storage
- Date boundaries (for daily grouping) calculated in local time

---

## 12. Acceptance Criteria

The application is complete when:

1. ✓ User can log in with password, session persists for 7 days
2. ✓ Brute force protection prevents rapid login attempts
3. ✓ User can create, edit, archive, and delete clients
4. ✓ User can create, edit, archive, and delete projects
5. ✓ User can clock in and out with a timer
6. ✓ User can manually add/edit work sessions
7. ✓ User can allocate time to projects in 15-minute increments
8. ✓ System prevents allocating more time than clocked
9. ✓ User can navigate to any date via calendar
10. ✓ User can see unallocated time prominently displayed
11. ✓ User can generate billing summaries by date range
12. ✓ Reports show separate totals for CHF and EUR
13. ✓ Budget progress is visible for clients and projects with budgets
14. ✓ Application is deployed and accessible on Render