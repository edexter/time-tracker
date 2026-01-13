FROM python:3.11-slim

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Frontend dependencies
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install

# Copy application code
WORKDIR /app
COPY backend/ backend/
COPY frontend/ frontend/

ENV FLASK_APP=backend/app.py
EXPOSE 5000

# Development command (overridden in docker-compose)
CMD ["flask", "run", "--host=0.0.0.0"]
