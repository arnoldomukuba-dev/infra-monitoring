# Production Deployment Guide: ODRISYSTEMS Platform

This guide outlines the production deployment architecture, system requirements, security hardening, database backup strategies, and step-by-step procedures for deploying the **ODRISYSTEMS Infrastructure Monitoring Platform** on a live server.

---

## 🏗️ 1. Recommended Production Architecture

```
                       ┌─────────────────────────┐
                       │     Public Internet     │
                       └────────────┬────────────┘
                                    │ HTTPS (Port 443)
                                    ▼
                       ┌─────────────────────────┐
                       │  Nginx / Cloudflare /   │
                       │   Certbot SSL Proxy     │
                       └────────────┬────────────┘
                                    │ HTTP Proxy (Internal network)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Docker Container Network                        │
│                                                                        │
│   ┌────────────────────────┐            ┌──────────────────────────┐   │
│   │   odri_monitor_frontend│            │   odri_monitor_backend   │   │
│   │   (React + Nginx Proxy)│───────────►│   (FastAPI + Uvicorn)    │   │
│   └────────────────────────┘            └─────────────┬────────────┘   │
│                                                       │                │
│                                                       ▼                │
│                                         ┌──────────────────────────┐   │
│                                         │     odri_monitor_db      │   │
│                                         │   (PostgreSQL 15 Volume) │   │
│                                         └──────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ 2. Required Server Specifications

| Hardware Component | Minimum Requirement | Recommended Production |
| :--- | :--- | :--- |
| **CPU** | 2 vCPU Cores | 4 vCPU Cores |
| **RAM** | 2 GB | 4 GB to 8 GB |
| **Disk Space** | 20 GB SSD | 50 GB+ High-Speed NVMe |
| **Operating System** | Ubuntu 22.04 LTS / Debian 12 / RHEL 9 | Ubuntu 22.04 LTS Server |
| **Architecture** | x86_64 / amd64 | x86_64 / amd64 |

---

## 🔌 3. Required Network Ports & Security Group Rules

| Port | Protocol | Ingress Source | Service / Purpose |
| :--- | :--- | :--- | :--- |
| **80** | TCP | Public (`0.0.0.0/0`) | HTTP (Redirects to HTTPS via SSL Proxy) |
| **443** | TCP | Public (`0.0.0.0/0`) | HTTPS (Secure User Interface & API Access) |
| **22** | TCP | Restricted IP (`your-office-ip`) | SSH Server Management |
| **8080** | TCP | Localhost / Proxy only | Internal React Frontend HTTP Port |
| **8081** | TCP | Localhost / Proxy only | Internal FastAPI Backend HTTP Port |
| **5432 / 5433** | TCP | `127.0.0.1` (Closed to Public) | Internal PostgreSQL Database Port |

---

## 🔑 4. Production Environment Variables (`.env`)

Create `/opt/infra-monitoring/.env` on the host server:

```ini
# Database Credentials
POSTGRES_USER=odri_admin
POSTGRES_PASSWORD=COMPLEX_GENERATED_SECURE_PASSWORD_32_CHARS
POSTGRES_DB=infra_monitoring
POSTGRES_PORT=5432
DATABASE_URL=postgresql://odri_admin:COMPLEX_GENERATED_SECURE_PASSWORD_32_CHARS@db:5432/infra_monitoring

# Security & JWT Tokens
JWT_SECRET=GENERATED_64_CHAR_HEX_SECRET_KEY
SECRET_KEY=GENERATED_64_CHAR_HEX_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Environment & CORS
ENVIRONMENT=production
CORS_ORIGINS=https://monitoring.odrisystems.io,https://api.monitoring.odrisystems.io

# Docker Port Bindings
FRONTEND_PORT=8080
BACKEND_PORT=8081

# Frontend API URL
VITE_API_URL=https://monitoring.odrisystems.io

# SMTP Email Alerts
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@mg.odrisystems.io
SMTP_PASSWORD=PROD_SMTP_CREDENTIAL_PASSWORD
SMTP_FROM=alerts@odrisystems.io
```

---

## 📦 5. Step-by-Step Production Deployment Commands

### Step 5.1: Install Prerequisites (Docker & Docker Compose)
```bash
sudo apt-get update && sudo apt-get install -y curl git docker.io docker-compose-v2
sudo systemctl enable --now docker
```

### Step 5.2: Clone Project & Set Configuration
```bash
cd /opt
sudo git clone https://github.com/odrisystems/infra-monitoring.git
cd infra-monitoring
sudo cp .env.example .env
sudo nano .env # Insert custom secure passwords and domain names
```

### Step 5.3: Build & Start Production Containers
```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

### Step 5.4: Run Database Migrations
```bash
sudo docker compose exec -T backend alembic upgrade head
```

---

## 🛡️ 6. Host Nginx + Certbot SSL Proxy Setup

Install Nginx & Certbot on the host server to terminate TLS/SSL:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/monitoring.odrisystems.io`:

```nginx
server {
    server_name monitoring.odrisystems.io;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and request SSL certificate:

```bash
sudo ln -s /etc/nginx/sites-available/monitoring.odrisystems.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d monitoring.odrisystems.io
```

---

## 💾 7. Database Backup & Restore Automated Cron Job

### Automated Nightly Backup Cron Job
Add to root crontab (`sudo crontab -e`):

```cron
# Daily PostgreSQL backup at 02:00 AM
0 2 * * * docker compose -f /opt/infra-monitoring/docker-compose.yml exec -T db pg_dump -U odri_admin infra_monitoring | gzip > /opt/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

### Restoring Backup
```bash
gunzip -c /opt/backups/db_20260810_020000.sql.gz | docker compose exec -i db psql -U odri_admin -d infra_monitoring
```

---

## 🔄 8. Zero-Downtime Update & Rollback Procedures

### Updating to New Release
```bash
cd /opt/infra-monitoring
git pull origin main
docker compose build --no-cache
docker compose up -d --no-deps backend frontend
docker compose exec -T backend alembic upgrade head
```

### Rollback Procedure
```bash
cd /opt/infra-monitoring
git checkout <previous-tag-or-commit>
docker compose up -d --build
```

---

## 🔍 9. Health Checks, Logging, & Troubleshooting

### Inspect Container Logs
```bash
# All logs
docker compose logs -f

# Backend logs only
docker compose logs -f backend
```

### Service Health Checks
```bash
docker compose ps
curl -I http://localhost:8081/health
```

---

## 📋 Production Readiness Checklist

- [x] **PostgreSQL Isolated**: Database port is bound to `127.0.0.1` and closed to external traffic.
- [x] **SSL Ready**: Nginx proxy routing configured for HTTPS termination.
- [x] **Persistent Storage**: Data volume `postgres_data` configured.
- [x] **FastAPI Production Engine**: Running behind Uvicorn without `--reload` flag.
- [x] **Security**: JWT expiration active, passwords stored using bcrypt hashes.
- [x] **Build Verification**: React frontend compiled and tested via Nginx static asset serving.
- [x] **Test Verification**: Pytest suite passing 100%.

**PROJECT IS READY FOR PUBLIC SERVER DEPLOYMENT.**
