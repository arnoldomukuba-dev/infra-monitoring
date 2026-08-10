# Production Rollback Guide

This guide details emergency rollback procedures for the **ODRISYSTEMS Infrastructure Monitoring Platform** in the event of failed updates, broken migrations, or unexpected production regressions.

---

## 1. Overview & Rollback Triggers

Initiate a rollback if post-deployment checks fail due to:
- Critical HTTP 5xx API errors across backend routes.
- Failed frontend asset loading or unhandled JavaScript compilation runtime errors.
- Unrecoverable database migration errors.
- High memory/CPU leaks caused by new release logic.

---

## 2. Fast Application Rollback (Code Reversion)

If database schemas did not change, perform a code rollback to the previous stable release tag (`v1.0.0`):

### Step 2.1: Checkout Previous Stable Tag
```bash
cd /opt/infra-monitoring
git fetch --tags
git checkout v1.0.0
```

### Step 2.2: Rebuild & Restart Production Containers
```bash
docker compose up -d --build --no-deps backend frontend
```

### Step 2.3: Verify System Status
```bash
docker compose ps
curl -f http://localhost:8081/health
```

---

## 3. Full System & Database Rollback Procedure

If a failed release included database schema modifications or migrations:

### Step 3.1: Stop Running Application Services
```bash
docker compose stop backend frontend
```

### Step 3.2: Restore Previous Database Backup
Locate the pre-deployment database backup created before the release:

```bash
gunzip -c /opt/backups/manual_backup_PRE_DEPLOYMENT.sql.gz | docker compose exec -i db psql -U odri_admin -d infra_monitoring
```

### Step 3.3: Revert Git Tag to Previous Version
```bash
git checkout v1.0.0
```

### Step 3.4: Rebuild Containers Cleanly
```bash
docker compose build --no-cache
docker compose up -d
```

### Step 3.5: Execute Health & Integrity Check
```bash
docker compose exec -T backend sh -c "PYTHONPATH=. pytest"
```

---

## 4. Emergency Container Recovery

If Docker container builds fail during deployment:

```bash
# Stop all containers
docker compose down

# Prune invalid build caches
docker builder prune -f

# Re-deploy from pristine release tag
git checkout v1.0.0
docker compose up -d --build
```
