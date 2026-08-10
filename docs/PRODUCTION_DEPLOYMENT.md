# Production Deployment Guide: Ubuntu 24.04 LTS

This guide provides step-by-step instructions for deploying the **ODRISYSTEMS Infrastructure Monitoring Platform** on a fresh **Ubuntu 24.04 LTS VPS** using Docker Engine, Docker Compose, Nginx, Certbot (HTTPS/SSL), PostgreSQL, FastAPI, and React.

---

## 1. VPS Minimum Specifications

| Resource | Minimum Requirement | Recommended Production |
| :--- | :--- | :--- |
| **OS** | Ubuntu 24.04 LTS (Noble Numbat) | Ubuntu 24.04 LTS 64-bit |
| **CPU** | 2 vCPU Cores | 4 vCPU Cores |
| **RAM** | 2 GB | 4 GB to 8 GB |
| **Storage** | 20 GB SSD | 50 GB+ NVMe SSD |
| **Networking** | 1 Public IPv4 Address | 1 Public IPv4 Address + IPv6 |

---

## 2. Required Ubuntu Packages

Install essential system tools and dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw ca-certificates gnupg lsbrelease nginx certbot python3-certbot-nginx tar gzip
```

---

## 3. Docker Installation (Official Docker Repository)

Set up Docker's official GPG key and APT repository on Ubuntu 24.04:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable Docker service:
```bash
sudo systemctl enable --now docker
```

---

## 4. Docker Compose Setup Verification

Verify Docker Compose plugin installation:

```bash
docker compose version
```

---

## 5. Firewall Configuration (UFW)

Secure the server using Ubuntu's Uncomplicated Firewall (UFW):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
sudo ufw status verbose
```

---

## 6. Project Deployment from GitHub

Clone the repository to `/opt/infra-monitoring`:

```bash
cd /opt
sudo git clone https://github.com/odrisystems/infra-monitoring.git
cd infra-monitoring
sudo chown -R $USER:$USER /opt/infra-monitoring
```

---

## 7. Production `.env` Configuration

Copy the template and configure your production credentials:

```bash
cp .env.example .env
nano .env
```

Set secure production values:
```ini
# PostgreSQL Credentials
POSTGRES_USER=odri_admin
POSTGRES_PASSWORD=YOUR_GENERATE_32_CHAR_RANDOM_PASSWORD
POSTGRES_DB=infra_monitoring
POSTGRES_PORT=5432
DATABASE_URL=postgresql://odri_admin:YOUR_GENERATE_32_CHAR_RANDOM_PASSWORD@db:5432/infra_monitoring

# Security & JWT Tokens
JWT_SECRET=YOUR_64_CHAR_RANDOM_HEX_SECRET_KEY
SECRET_KEY=YOUR_64_CHAR_RANDOM_HEX_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Environment & CORS
ENVIRONMENT=production
CORS_ORIGINS=https://monitoring.odrisystems.io

# Docker Port Bindings
FRONTEND_PORT=8080
BACKEND_PORT=8081

# Frontend Relative API Proxy Routing
VITE_API_URL=

# SMTP Email Notification Settings
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=postmaster@mg.odrisystems.io
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
SMTP_FROM=alerts@odrisystems.io
```

---

## 8. PostgreSQL Persistent Storage Verification

Ensure the PostgreSQL volume definition exists in `docker-compose.yml`:
- Data volume: `postgres_data` -> `/var/lib/postgresql/data`
- PostgreSQL is bound strictly to `127.0.0.1:5433` on the host, preventing external access.

---

## 9. Docker Compose Production Startup

Build and start the containerized infrastructure in background mode:

```bash
docker compose build --no-cache
docker compose up -d
```

Verify container states:
```bash
docker compose ps
```

---

## 10. Nginx Reverse Proxy Configuration

Create Nginx site configuration `/etc/nginx/sites-available/monitoring.odrisystems.io`:

```bash
sudo nano /etc/nginx/sites-available/monitoring.odrisystems.io
```

Paste the following configuration:
```nginx
server {
    listen 80;
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

Enable site configuration:
```bash
sudo ln -s /etc/nginx/sites-available/monitoring.odrisystems.io /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 11. HTTPS/SSL Configuration (Let's Encrypt / Certbot)

Obtain a free SSL certificate:

```bash
sudo certbot --nginx -d monitoring.odrisystems.io --non-interactive --agree-tos --email admin@odrisystems.io
```

Certbot will automatically configure HTTPS redirect rules in Nginx. Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## 12. Domain Configuration

Ensure your DNS provider has an **A Record** pointing your domain to the VPS IP:
- Type: `A`
- Name: `monitoring` (or `@`)
- Value: `YOUR_VPS_PUBLIC_IPV4`
- TTL: `300`

---

## 13. Database Migration (Alembic)

Apply all database schema migrations inside the backend container:

```bash
docker compose exec -T backend alembic upgrade head
```

---

## 14. Database Backup

Run an on-demand PostgreSQL database backup:

```bash
mkdir -p /opt/backups
docker compose exec -T db pg_dump -U odri_admin infra_monitoring | gzip > /opt/backups/db_$(date +%Y%m%d_%H%M%S).sql.gz
```

Set up automated daily backups via crontab (`sudo crontab -e`):
```cron
0 2 * * * docker compose -f /opt/infra-monitoring/docker-compose.yml exec -T db pg_dump -U odri_admin infra_monitoring | gzip > /opt/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## 15. Database Restore

Restore database from a gzipped SQL dump:

```bash
gunzip -c /opt/backups/db_20260810_020000.sql.gz | docker compose exec -i db psql -U odri_admin -d infra_monitoring
```

---

## 16. Application Update Procedure

```bash
cd /opt/infra-monitoring
git pull origin main
docker compose build --no-cache
docker compose up -d --no-deps backend frontend
docker compose exec -T backend alembic upgrade head
```

---

## 17. Rollback Procedure

```bash
cd /opt/infra-monitoring
git checkout v1.0.0
docker compose up -d --build
```
*(For detailed steps, refer to `docs/ROLLBACK.md`).*

---

## 18. Container Monitoring

Check container CPU and memory resource consumption:

```bash
docker stats
```

---

## 19. Log Management

View consolidated or service-specific container logs:

```bash
# All logs
docker compose logs -f --tail=100

# Backend logs
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend
```

---

## 20. Health Checks

Verify application health endpoints:

```bash
# Backend health endpoint
curl -f http://localhost:8081/health

# Public domain health
curl -I https://monitoring.odrisystems.io
```
