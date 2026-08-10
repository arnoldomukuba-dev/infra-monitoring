# ODRISYSTEMS Infrastructure Monitoring Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/odrisystems/infra-monitoring)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-cyan.svg)](docker-compose.yml)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB.svg)](https://react.dev/)

**ODRISYSTEMS Infrastructure Monitoring Platform** is an enterprise-grade, real-time infrastructure observability, backup monitoring, and alert management system. Built with modern full-stack technologies (FastAPI, React, PostgreSQL, Nginx, Docker), it provides full visiblity into server resource telemetry, backup operations, automated threshold alerting, audit trails, and Role-Based Access Control (RBAC).

---

## 🚀 Features

- **Real-Time Telemetry & Monitoring**: Monitor host CPU load, RAM utilization, disk partition space, and uptime across distributed server nodes.
- **Automated Threshold Alerting**: Automatic generation of `WARNING` and `CRITICAL` alerts based on configurable metrics (e.g. Disk > 90%, RAM > 80%).
- **Backup Verification Engine**: Track backup job executions (`SUCCESS` vs `FAILED`), track backup sizes, and trigger immediate alerts upon backup failure.
- **Audit Logging**: Immutable event log tracking user logins, server registrations, threshold breaches, and backup status changes.
- **Multi-Role Access Control (RBAC)**: Fine-grained permissions for 4 distinct roles:
  - 👑 `ADMIN`: Full administrative control over users, settings, servers, backups, and logs.
  - 🛠️ `INFRASTRUCTURE_MANAGER`: Manage servers, backup configurations, and trigger heartbeats.
  - 👁️ `MONITORING_OPERATOR`: View telemetry, acknowledge alerts, and monitor system metrics.
  - 📖 `READ_ONLY`: Read-only access to monitoring dashboards and alerts.
- **Containerized Architecture**: Isolated, microservices-based deployment using Docker Compose and Nginx reverse proxy.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS design system, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, Uvicorn |
| **Database** | PostgreSQL 15, SQLAlchemy ORM, Alembic Migrations |
| **Authentication** | OAuth2 Password Bearer, JWT Tokens, Bcrypt Password Hashing |
| **Web Server / Proxy** | Nginx Alpine (Reverse Proxy & Static Asset Serving) |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Project Structure

```
infra-monitoring/
├── docker-compose.yml        # Orchestration setup for PostgreSQL, Backend, and Frontend
├── .env.example              # Sanitized environment configuration template
├── README.md                 # Production documentation & guide
├── CHANGELOG.md              # Project release history (v1.0.0)
├── docs/                     # Architecture & migration documentation
├── src/
│   ├── backend/              # FastAPI Python backend application
│   │   ├── Dockerfile        # Backend container build instructions
│   │   ├── alembic/          # Database migration scripts
│   │   ├── app/
│   │   │   ├── api/          # API route controllers (/auth, /servers, /alerts, /backups, /logs, /users)
│   │   │   ├── core/         # Core security, JWT, config & RBAC dependencies
│   │   │   ├── database/     # SQLAlchemy database connection session
│   │   │   ├── models/       # Database models (User, Server, Alert, Backup, Log, Notification)
│   │   │   ├── schemas/      # Pydantic validation schemas
│   │   │   ├── services/     # Business logic & monitoring services
│   │   │   └── tests/        # Pytest unit and integration test suite
│   │   └── requirements.txt  # Python backend dependencies
│   └── frontend/             # React Vite frontend application
│       ├── Dockerfile        # Multi-stage production build (Node + Nginx)
│       ├── nginx.conf        # Production Nginx reverse proxy configuration
│       ├── package.json      # Frontend npm dependencies
│       └── src/              # React pages, components, context, and API modules
```

---

## ⚡ Quick Start & Docker Setup

### Prerequisites
- Docker Engine `v20.10+`
- Docker Compose `v2.0+`

### Installation & Deployment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/odrisystems/infra-monitoring.git
   cd infra-monitoring
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *(Edit `.env` to configure your custom JWT secrets and database passwords if needed).*

3. **Start Containerized Platform**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify Running Services**:
   ```bash
   docker compose ps
   ```

5. **Access Application**:
   - **Frontend UI**: `http://localhost:8080`
   - **Backend API**: `http://localhost:8081`
   - **Interactive API Docs (Swagger)**: `http://localhost:8081/docs`

---

## 🔑 Default RBAC Credentials

| Role | Username | Default Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full Access (Users, Settings, Servers, Backups) |
| **Manager** | `manager` | `manager123` | Infrastructure & Backup Operations |
| **Operator** | `operator` | `operator123` | Monitoring & Alert Acknowledgements |
| **Read Only** | `readonly` | `readonly123` | Telemetry Read-Only Views |

---

## 💾 Database Backup & Restore Procedures

### Database Persistence
PostgreSQL data is stored in the persistent Docker volume `infra-monitoring_postgres_data`. Data persists across container restarts and updates.

### Creating a Manual Database Backup
```bash
docker compose exec -T db pg_dump -U postgres infra_monitoring > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring a Database Backup
```bash
docker compose exec -i db psql -U postgres -d infra_monitoring < backup_file.sql
```

---

## 🧪 Testing & Quality Assurance

### Run Backend Unit & Integration Tests
```bash
docker compose exec -T backend sh -c "PYTHONPATH=. pytest"
```

### Run Frontend Production Build Check
```bash
cd src/frontend
npm run build
```

---

## 🛡️ Production Release Checklist

- [x] All default passwords securely hashed in database via bcrypt.
- [x] Environment files (`.env`) excluded from version control via `.gitignore`.
- [x] `VITE_API_URL` set to relative path (`""`) for seamless Nginx proxying.
- [x] PostgreSQL volume persistence verified.
- [x] Container health checks verified and passing.
- [x] Backend test suite passing 100% (5/5 suites).
- [x] Frontend asset compilation tested via Vite production build.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
