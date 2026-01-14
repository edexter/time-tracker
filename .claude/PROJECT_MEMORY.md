# Project Memory - Time Tracker

## Deployment

### DockerHub Push Protocol
**IMPORTANT**: Always use `./docker-push.sh` for pushing Docker images to DockerHub.

- Never use manual `docker build` and `docker push` commands
- The script handles authentication, tagging, and pushing correctly
- Usage: `./docker-push.sh [tag]` (defaults to `latest`)
- Script location: `/home/eric/projects/time_tracking/docker-push.sh`

### Deployment Architecture
- Build locally → Push to DockerHub → Manual deploy on Render
- No auto-deploy on git push (intentional)
- Full control over production updates
- Database: Render managed PostgreSQL (persistent storage)

### Key Files
- `Dockerfile.prod` - Production multi-stage build
- `docker-push.sh` - **Use this for all DockerHub pushes**
- `render.yaml` - Image-backed service configuration
- `start.sh` - Entrypoint (migrations + gunicorn)

## Project Structure
- Backend: Flask + PostgreSQL
- Frontend: React + Vite (built into Docker image)
- Migrations: Flask-Migrate (auto-run on deploy)
