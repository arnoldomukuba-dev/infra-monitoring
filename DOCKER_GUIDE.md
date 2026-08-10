# ODRISYSTEMS Production Docker & Operations Guide

---

## Table of Contents
1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Environment Setup](#2-environment-setup)
3. [How to Start the System](#3-how-to-start-the-system)
4. [How to Stop the System](#4-how-to-stop-the-system)
5. [How to View Logs](#5-how-to-view-logs)
6. [How to Restart Services](#6-how-to-restart-services)
7. [How to Run Database Migrations](#7-how-to-run-database-migrations)
8. [How to Back Up & Restore PostgreSQL](#8-how-to-back-up--restore-postgresql)
9. [How to Update the Application](#9-how-to-update-the-application)
10. [Container Architecture](#10-container-architecture)

---

## 1. Prerequisites & System Requirements

- **Docker Engine**: v20.10.0+
- **Docker Compose**: v2.10.0+
- **Host OS**: Linux, macOS, or Windows WSL2
- **Hardware Requirements**: Minimum 2 CPU cores, 2 GB RAM, 10 GB free disk space

Verify Docker installation:
```bash
docker --version
docker compose version
```

---

## 2. Environment Setup

1. Copy the production environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with real credentials:
   ```ini
   POSTGRES_USER=odri_admin
   POSTGRES_PASSWORD=your_strong_db_password
   POSTGRES_DB=odridb
   DATABASE_URL=postgresql://odri_admin:your_strong_db_password@db:5432/odridb

   JWT_SECRET=your_random_64_char_secret_key
   SECRET_KEY=your_random_64_char_secret_key
   ENVIRONMENT=production

   FRONTEND_PORT=8000
   BACKEND_PORT=8001
   VITE_API_URL=http://localhost:8001
   ```

---

## 3. How to Start the System

1. Validate the Docker Compose configuration:
   ```bash
   docker compose config
   ```

2. Build and launch all services in detached mode:
   ```bash
   docker compose up -d --build
   ```

3. Verify container status and health:
   ```bash
   docker compose ps
   ```

4. Access services:
   - **Frontend UI**: `http://localhost:8000`
   - **Backend API**: `http://localhost:8001`
   - **Health Check**: `http://localhost:8001/health`

---

## 4. How to Stop the System

- **Stop containers (preserve persistent volume data)**:
  ```bash
  docker compose down
  ```

- **Stop containers AND delete volumes (CAUTION: Destroys PostgreSQL database)**:
  ```bash
  docker compose down -v
  ```

---

## 5. How to View Logs

- View aggregated logs for all containers:
  ```bash
  docker compose logs -f
  ```

- View logs for a specific service:
  ```bash
  docker compose logs -f backend
  docker compose logs -f frontend
  docker compose logs -f db
  ```

- View last 100 lines for backend:
  ```bash
  docker compose logs --tail=100 backend
  ```

---

## 6. How to Restart Services

- Restart all services:
  ```bash
  docker compose restart
  ```

- Restart single service (e.g. backend after code change):
  ```bash
  docker compose restart backend
  ```

---

## 7. How to Run Database Migrations

- Execute Alembic database migrations inside the running backend container:
  ```bash
  docker compose exec backend python -m alembic upgrade head
  ```

- Check current database migration status:
  ```bash
  docker compose exec backend python -m alembic current
  ```

---

## 8. How to Back Up & Restore PostgreSQL

### Create Database Backup
Execute `pg_dump` inside the database container to create a timestamped SQL backup:
```bash
docker compose exec -T db pg_dump -U postgres odridb > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database Backup
Restore an existing SQL dump file into PostgreSQL:
```bash
cat backup_20260810_120000.sql | docker compose exec -T db psql -U postgres -d odridb
```

---

## 9. How to Update the Application

1. Pull latest code from repository:
   ```bash
   git pull origin main
   ```

2. Rebuild container images with new code:
   ```bash
   docker compose up -d --build
   ```

3. Apply database migrations:
   ```bash
   docker compose exec backend python -m alembic upgrade head
   ```

4. Confirm healthy execution:
   ```bash
   docker compose ps
   ```

---

## 10. Container Architecture

```
                      [ Client Browser ]
                              │
               ┌──────────────┴──────────────┐
               │ Port 8000                   │ Port 8001
               ▼                             ▼
     ┌───────────────────┐         ┌───────────────────┐
     │  odri_frontend    │         │   odri_backend    │
     │  (Nginx SPA Web)  │────────►│  (FastAPI Server) │
     └───────────────────┘         └─────────┬─────────┘
                                             │ Internal DNS (db:5432)
                                             ▼
                                   ┌───────────────────┐
                                   │     odri_db       │
                                   │  (PostgreSQL 15)  │
                                   │  Volume: pgdata   │
                                   └───────────────────┘
```
