#!/bin/bash
set -e

echo "Starting Time Tracker application..."

# Check database configuration
echo "Checking database configuration..."
python -c "
import os
from urllib.parse import urlparse

db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print('ERROR: DATABASE_URL not set')
    exit(1)

url = urlparse(db_url)
if url.scheme == 'sqlite':
    # SQLite - ensure directory exists
    db_path = url.path
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        print(f'Created database directory: {db_dir}')
    print(f'Using SQLite database: {db_path}')
elif url.scheme in ['postgresql', 'postgres']:
    # PostgreSQL - wait for connection
    import time
    import psycopg2
    max_retries = 30
    retry_count = 0

    while retry_count < max_retries:
        try:
            conn = psycopg2.connect(
                dbname=url.path[1:],
                user=url.username,
                password=url.password,
                host=url.hostname,
                port=url.port
            )
            conn.close()
            print('PostgreSQL database is ready!')
            break
        except psycopg2.OperationalError:
            retry_count += 1
            print(f'Database not ready yet... ({retry_count}/{max_retries})')
            time.sleep(2)
    else:
        print('ERROR: Could not connect to PostgreSQL database')
        exit(1)
else:
    print(f'ERROR: Unsupported database scheme: {url.scheme}')
    exit(1)
"

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Validate configuration
echo "Validating configuration..."
python -c "
from backend.config import config
import os
config_name = os.environ.get('FLASK_ENV', 'production')
config[config_name].validate()
print('Configuration validated successfully')
"

# Start gunicorn
echo "Starting gunicorn server..."
exec gunicorn \
    --bind 0.0.0.0:${PORT:-10000} \
    --workers ${WORKERS:-4} \
    --threads ${THREADS:-2} \
    --timeout ${TIMEOUT:-120} \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    "backend.app:create_app('production')"
