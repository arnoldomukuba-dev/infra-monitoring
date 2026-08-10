# Dockerize BackupMonitor Pro Application

This implementation plan outlines the steps and configuration required to containerize the application (FastAPI backend + React frontend + PostgreSQL database) using Docker and Docker Compose.

The docker-compose file will reside outside the `src/` directory in the root of the project (`/arnold/infra-monitoring/docker-compose.yml`).

## User Review Required

> [!IMPORTANT]
> - **Frontend Port**: The frontend container will expose port `80` internally and run via Nginx. On the host machine, this will be mapped to `8000` (`8000:80`), fulfilling the requirement to expose the frontend to port 8000.
> - **Backend Port**: The backend service will run on port `8080` externally (mapped to 8000 internally) to avoid host port conflicts with the frontend.
> - **Filesystem Layout**:
>   - `/arnold/infra-monitoring/docker-compose.yml` - Root compose file.
>   - `/arnold/infra-monitoring/src/backend/Dockerfile` - Backend container build config.
>   - `/arnold/infra-monitoring/src/backend/.dockerignore` - Exclude `venv`, `__pycache__`, `node_modules`.
>   - `/arnold/infra-monitoring/src/frontend/Dockerfile` - Frontend container build config.
>   - `/arnold/infra-monitoring/src/frontend/.dockerignore` - Exclude `node_modules`, `dist`.

## Proposed Changes

---

### Core Configuration Adjustments

#### [MODIFY] [main.py](file:///arnold/infra-monitoring/src/backend/app/main.py)
- Update CORS middleware to dynamically read origins from the `CORS_ORIGINS` environment variable (allowing `http://localhost:8000` because the frontend is exposed on port 8000).

#### [MODIFY] [api.js](file:///arnold/infra-monitoring/src/frontend/src/api/api.js)
- Read the API URL using Vite's `import.meta.env.VITE_API_URL` instead of a hardcoded backend url.

#### [MODIFY] [auth.js](file:///arnold/infra-monitoring/src/frontend/src/api/auth.js)
- Read the API URL using Vite's `import.meta.env.VITE_API_URL`.

---

### New Docker Configurations

#### [NEW] [docker-compose.yml](file:///arnold/infra-monitoring/docker-compose.yml)
- Define `db` (Postgres 15, health-checked).
- Define `backend` (FastAPI, depends on `db`, exposes `8080:8000`).
- Define `frontend` (React + Nginx, build arg `VITE_API_URL=http://localhost:8080`, exposes `8000:80` internally).

#### [NEW] [Dockerfile](file:///arnold/infra-monitoring/src/backend/Dockerfile)
- Lightweight Python template, copies source, runs `uvicorn`.

#### [NEW] [.dockerignore](file:///arnold/infra-monitoring/src/backend/.dockerignore)
- Ignore `venv/`, `__pycache__`, `node_modules/`, `.git`, `.env` etc.

#### [NEW] [Dockerfile](file:///arnold/infra-monitoring/src/frontend/Dockerfile)
- Multi-stage Node builder + Nginx hosting on port 80.

#### [NEW] [nginx.conf](file:///arnold/infra-monitoring/src/frontend/nginx.conf)
- SPA-compatible Nginx configuration.

#### [NEW] [.dockerignore](file:///arnold/infra-monitoring/src/frontend/.dockerignore)
- Ignore `node_modules/`, `dist/`, `.git` etc.

---

## Verification Plan

### Automated Verification
- Run `docker compose build` to ensure both Docker builds succeed.
- Run `docker compose up -d` to check if all services run without errors.
- Curl tests:
  - Frontend: `curl -I http://localhost:8000`
  - Backend: `curl -I http://localhost:8080/health`
