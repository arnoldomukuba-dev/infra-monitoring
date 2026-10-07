# ODRISYSTEMS Infrastructure Monitoring Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/arnoldomukuba-dev/infra-monitoring)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React-61DAFB.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791.svg)](https://www.postgresql.org/)

**ODRISYSTEMS Infrastructure Monitoring Platform** is a full-stack infrastructure observability and backup monitoring system designed to provide centralized visibility into server health, resource utilization, backup operations, alerts, and audit activity.

The platform combines a **FastAPI backend, React frontend, PostgreSQL database, Nginx, and Docker Compose** into a containerized monitoring environment.

---

## 🚀 Key Features

### Infrastructure Monitoring

- Real-time CPU utilization monitoring
- RAM utilization monitoring
- Disk and partition monitoring
- Server uptime tracking
- Distributed server/node monitoring

### Alert Management

- Configurable monitoring thresholds
- `WARNING` and `CRITICAL` alert levels
- Automatic threshold-based alert generation
- Alert acknowledgement workflow

### Backup Monitoring

- Backup job status tracking
- Successful and failed backup detection
- Backup size tracking
- Backup failure alerts
- Database backup and restore procedures

### Security & Access Control

- JWT-based authentication
- Password hashing with bcrypt
- Role-Based Access Control (RBAC)
- Multiple user roles and permissions
- Protected API endpoints
- Audit logging

### Audit & Administration

- User activity logging
- Server registration tracking
- Backup activity tracking
- Alert history
- Administrative management features

### Containerized Deployment

- Docker-based services
- Docker Compose orchestration
- PostgreSQL persistent storage
- Nginx reverse proxy
- Production-oriented frontend build

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │     Web Browser     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       Nginx         │
                    │ Reverse Proxy / Web │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │ Authentication/API  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      Database       │
                    └─────────────────────┘

             Monitoring / Backup Services
                         │
                         ▼
                 Server Telemetry
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, CSS, Lucide Icons |
| Backend | Python 3.11, FastAPI, Pydantic |
| API Server | Uvicorn |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Authentication | JWT / OAuth2 Password Bearer |
| Password Security | Bcrypt |
| Reverse Proxy | Nginx |
| Containerization | Docker |
| Orchestration | Docker Compose |
| Testing | Pytest |

---

## 📁 Project Structure

```text
infra-monitoring/
├── docker-compose.yml
├── .env.example
├── README.md
├── CHANGELOG.md
├── LICENSE
├── docs/
│   └── ...
├── src/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── alembic/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── database/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── tests/
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       └── src/
│
└── tests/
```

---

## ⚡ Quick Start

### Prerequisites

Make sure the following are installed:

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### 1. Clone the repository

```bash
git clone git@github-arnoldomukuba-dev:arnoldomukuba-dev/infra-monitoring.git
cd infra-monitoring
```

### 2. Configure environment variables

Create your local environment file:

```bash
cp .env.example .env
```

Review the values in `.env` and replace development secrets with secure production values where necessary.

> **Never commit `.env` or real credentials to GitHub.**

### 3. Build and start the platform

```bash
docker compose up -d --build
```

### 4. Check running containers

```bash
docker compose ps
```

### 5. View logs

```bash
docker compose logs -f
```

---

## 🌐 Application Access

Depending on your Docker Compose configuration, the platform provides access to the following services:

| Service | URL |
|---|---|
| Frontend | `http://localhost:8080` |
| Backend API | `http://localhost:8081` |
| Swagger API Docs | `http://localhost:8081/docs` |

If your local configuration uses different ports, refer to `docker-compose.yml`.

---

## 🔐 Authentication & RBAC

The platform supports role-based access control for different operational responsibilities.

| Role | Purpose |
|---|---|
| `ADMIN` | Full administrative access |
| `INFRASTRUCTURE_MANAGER` | Server and backup management |
| `MONITORING_OPERATOR` | Monitoring and alert operations |
| `READ_ONLY` | Read-only monitoring access |

**No production credentials are stored in this README.**

For local development credentials, use the application's configured environment or seed process.

---

## 💾 Database Backup & Restore

PostgreSQL data is stored in a persistent Docker volume.

### Create a database backup

```bash
docker compose exec -T db pg_dump -U postgres infra_monitoring > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore a database backup

```bash
docker compose exec -i db psql -U postgres -d infra_monitoring < backup_file.sql
```

Always verify backup files before performing a production restore.

---

## 🧪 Testing

### Run backend tests

```bash
docker compose exec -T backend sh -c "PYTHONPATH=. pytest"
```

### Build the frontend

```bash
cd src/frontend
npm run build
```

---

## 🛡️ Security Practices

The project follows several security-oriented practices:

- Environment secrets are excluded through `.gitignore`
- SSH private keys are excluded from version control
- Passwords are hashed before database storage
- JWT authentication protects API access
- RBAC restricts access according to user roles
- Database persistence is handled through Docker volumes
- API access is separated from frontend presentation
- Production secrets should be supplied through environment configuration

> **Important:** Before deploying to production, generate unique secrets and credentials and review all exposed ports and services.

---

## 🚀 Deployment

The application is designed around a containerized deployment model.

A typical deployment flow is:

```text
Developer
    │
    ▼
Git Repository
    │
    ▼
Docker Build
    │
    ▼
Docker Compose
    │
    ├── React / Nginx
    ├── FastAPI
    └── PostgreSQL
```

For production deployment, configure:

- Secure environment variables
- Strong database credentials
- Unique JWT secrets
- HTTPS/TLS
- Firewall rules
- Database backup schedules
- Monitoring and log retention

---

## 📋 Development Workflow

Recommended development workflow:

```bash
git pull
git checkout -b feature/your-feature
```

Make your changes, test them, then:

```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

Open a pull request for review before merging into `main`.

---

## 📌 Project Status

**Current release:** `v1.0.0`

The platform currently provides the foundation for:

- Infrastructure monitoring
- Backup monitoring
- Alert management
- Authentication
- RBAC
- Audit logging
- Containerized deployment
- PostgreSQL persistence

Future improvements can include additional monitoring agents, notification integrations, expanded dashboards, automated deployment pipelines, and cloud infrastructure integrations.

---

## 📄 License

This project is licensed under the MIT License.

See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Arnold Omukuba**

Software Development | Cloud Computing | Infrastructure & Systems

GitHub: [@arnoldomukuba-dev](https://github.com/arnoldomukuba-dev)
o
