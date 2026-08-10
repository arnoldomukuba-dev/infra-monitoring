# Database Backup & Restore Guide

This document defines the database backup strategies, backup verification routines, disaster recovery policies, and restore operations for the **ODRISYSTEMS Infrastructure Monitoring Platform**.

---

## 1. Overview & Persistence Architecture

The platform uses **PostgreSQL 15** containerized via Docker. All PostgreSQL database data is stored in the persistent Docker volume named `infra-monitoring_postgres_data`.

Data persists independently of container lifecycles (`docker compose down`, rebuilding images, or restarting the host VPS).

---

## 2. Automated Daily Backup Strategy

### Cron Setup
A daily cron task should be configured on the host VPS to perform automated backups at `02:00 AM`:

1. Open root crontab editor:
   ```bash
   sudo crontab -e
   ```

2. Add the following cron entry:
   ```cron
   0 2 * * * docker compose -f /opt/infra-monitoring/docker-compose.yml exec -T db pg_dump -U odri_admin infra_monitoring | gzip > /opt/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
   ```

3. Configure automatic backup retention (delete backups older than 30 days):
   ```cron
   30 2 * * * find /opt/backups -type f -name "db_*.sql.gz" -mtime +30 -delete
   ```

---

## 3. Manual On-Demand Backup

To create an immediate database backup before upgrading or performing system maintenance:

```bash
mkdir -p /opt/backups
docker compose exec -T db pg_dump -U odri_admin infra_monitoring | gzip > /opt/backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

Verify backup integrity and non-zero file size:
```bash
ls -lh /opt/backups/
```

---

## 4. Database Restore Procedure

### Step 4.1: Identify the Target Backup File
Locate the desired backup file in `/opt/backups/`:

```bash
ls -lt /opt/backups/
```

### Step 4.2: Stop Dependent Backend Service
Stop the backend service to prevent write conflicts during restoration:

```bash
docker compose stop backend
```

### Step 4.3: Execute Database Restoration
Decompress and pipe the SQL backup stream into the PostgreSQL container:

```bash
gunzip -c /opt/backups/manual_backup_20260810_223000.sql.gz | docker compose exec -i db psql -U odri_admin -d infra_monitoring
```

### Step 4.4: Restart Backend Service & Verify Integrity
Restart backend service:

```bash
docker compose start backend
```

Check health status:
```bash
docker compose exec -T backend sh -c "python -c 'import urllib.request; print(urllib.request.urlopen(\"http://localhost:80/health\").read())'"
```

---

## 5. External S3 Remote Backup Offsite Copy (Optional)

To stream backups directly to an AWS S3 bucket or S3-compatible object storage (e.g. Cloudflare R2, DigitalOcean Spaces):

```bash
aws s3 sync /opt/backups/ s3://odri-vault-backups/postgres/ --delete
```
