from datetime import datetime, timezone, timedelta
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.backup import Backup
from app.models.server import Server
from app.models.alert import Alert
from app.models.user import User
from app.schemas.backup import BackupCreate, BackupUpdate, BackupResponse, BackupSummaryResponse
from app.services.log_service import create_audit_log
from app.core.dependencies import get_infra_manager_or_admin, get_current_user_strict

router = APIRouter(
    prefix="/backups",
    tags=["Backups"]
)


def trigger_backup_failure_alert(db: Session, backup: Backup) -> None:
    """Automatically generate a CRITICAL alert in PostgreSQL when a backup fails."""
    server_name = "Unknown Server"
    if backup.server_id:
        server = db.query(Server).filter(Server.id == backup.server_id).first()
        if server:
            server_name = server.name
    elif backup.system_name:
        server_name = backup.system_name

    err_desc = backup.error_message or "Execution failed or storage unavailable"
    msg = f"Backup job '{backup.backup_name}' FAILED on {server_name}: {err_desc}"

    # Prevent duplicate active critical alerts for same backup name
    now = datetime.now(timezone.utc)
    existing = (
        db.query(Alert)
        .filter(
            Alert.alert_type == "BACKUP",
            Alert.severity == "CRITICAL",
            Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"]),
            Alert.message.contains(backup.backup_name)
        )
        .first()
    )

    if existing:
        existing.message = msg
        existing.timestamp = now
    else:
        new_alert = Alert(
            server_id=backup.server_id,
            server_name=server_name,
            alert_type="BACKUP",
            severity="CRITICAL",
            message=msg,
            status="ACTIVE",
            created_at=now,
            timestamp=now,
        )
        db.add(new_alert)


def parse_storage_gb(size_str: Optional[str]) -> float:
    if not size_str:
        return 0.0
    try:
        parts = size_str.strip().split()
        val = float(parts[0])
        unit = parts[1].upper() if len(parts) > 1 else "GB"
        if "MB" in unit:
            return round(val / 1024, 2)
        elif "TB" in unit:
            return round(val * 1024, 2)
        return round(val, 2)
    except Exception:
        return 1.5


@router.post("/", response_model=BackupResponse, status_code=status.HTTP_201_CREATED)
def create_backup(
    backup_in: BackupCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Create a new backup monitoring record and evaluate failure alerts."""
    now = datetime.now(timezone.utc)

    # Sync compatibility fields
    name = backup_in.backup_name or backup_in.file_name or "System Backup"
    sys_name = backup_in.system_name

    if backup_in.server_id and not sys_name:
        server = db.query(Server).filter(Server.id == backup_in.server_id).first()
        if server:
            sys_name = server.name

    new_backup = Backup(
        server_id=backup_in.server_id,
        backup_name=name,
        backup_type=backup_in.backup_type or "FULL",
        source=backup_in.source or "/var/data",
        destination=backup_in.destination or "s3://odri-backups/",
        status=(backup_in.status or "SUCCESS").upper(),
        size=backup_in.size or "1.5 GB",
        started_at=backup_in.started_at or now,
        completed_at=backup_in.completed_at or (now if backup_in.status != "RUNNING" else None),
        duration=backup_in.duration or "12m 45s",
        error_message=backup_in.error_message,
        system_name=sys_name,
        file_name=backup_in.file_name or name,
        storage_location=backup_in.storage_location or backup_in.destination,
        created_at=now,
    )
    db.add(new_backup)
    db.commit()
    db.refresh(new_backup)

    if new_backup.status in ["FAILED", "ERROR"]:
        trigger_backup_failure_alert(db, new_backup)
        create_audit_log(
            db,
            event_type="BACKUP_FAILED",
            severity="CRITICAL",
            message=f"Backup job '{new_backup.backup_name}' FAILED: {new_backup.error_message or 'Unknown error'}",
            server_id=new_backup.server_id,
        )
        from app.services import notification_service
        notification_service.create_notification(
            db=db,
            notification_type="BACKUP_FAILED",
            title=f"Backup Failed: {new_backup.backup_name}",
            message=f"Backup job '{new_backup.backup_name}' FAILED: {new_backup.error_message or 'Execution failed'}",
            severity="CRITICAL",
            server_id=new_backup.server_id,
        )
        db.commit()
    elif new_backup.status in ["SUCCESS", "SUCCESSFUL", "COMPLETED"]:
        create_audit_log(
            db,
            event_type="BACKUP_SUCCEEDED",
            severity="INFO",
            message=f"Backup job '{new_backup.backup_name}' completed successfully ({new_backup.size})",
            server_id=new_backup.server_id,
        )
        from app.services import notification_service
        notification_service.create_notification(
            db=db,
            notification_type="BACKUP_SUCCEEDED",
            title=f"Backup Succeeded: {new_backup.backup_name}",
            message=f"Backup job '{new_backup.backup_name}' completed successfully ({new_backup.size})",
            severity="INFO",
            server_id=new_backup.server_id,
        )
    elif new_backup.status in ["RUNNING", "IN_PROGRESS"]:
        create_audit_log(
            db,
            event_type="BACKUP_STARTED",
            severity="INFO",
            message=f"Backup job '{new_backup.backup_name}' started execution",
            server_id=new_backup.server_id,
        )

    # Populate server_name for response
    if new_backup.server_id:
        srv = db.query(Server).filter(Server.id == new_backup.server_id).first()
        if srv:
            setattr(new_backup, "server_name", srv.name)
    else:
        setattr(new_backup, "server_name", new_backup.system_name or "Host Node")

    return new_backup


@router.get("/", response_model=List[BackupResponse])
def get_backups(
    server_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """List all backup records with optional server, status, and type filters (Authenticated users)."""
    query = db.query(Backup)

    if server_id is not None:
        query = query.filter(Backup.server_id == server_id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Backup.status == status_filter.upper())

    if type_filter and type_filter.upper() != "ALL":
        query = query.filter(Backup.backup_type == type_filter.upper())

    backups = query.order_by(Backup.created_at.desc()).all()

    for b in backups:
        if b.server_id:
            srv = db.query(Server).filter(Server.id == b.server_id).first()
            if srv:
                setattr(b, "server_name", srv.name)
        else:
            setattr(b, "server_name", b.system_name or "Host Node")

    return backups


@router.get("/dashboard/summary", response_model=BackupSummaryResponse)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get aggregated backup overview statistics for Dashboard and Monitoring page (Authenticated users)."""
    backups = db.query(Backup).all()
    total = len(backups)
    successful = sum(1 for b in backups if b.status in ["SUCCESS", "SUCCESSFUL"])
    failed = sum(1 for b in backups if b.status in ["FAILED", "ERROR"])
    running = sum(1 for b in backups if b.status in ["RUNNING", "IN_PROGRESS"])
    warning = sum(1 for b in backups if b.status in ["WARNING"])

    success_percentage = f"{round((successful / total) * 100, 1)}%" if total > 0 else "0%"
    total_storage = sum(parse_storage_gb(str(b.size) if b.size else None) for b in backups)

    return {
        "total_backups": total,
        "successful_backups": successful,
        "failed_backups": failed,
        "running_backups": running,
        "warning_backups": warning,
        "success_percentage": success_percentage,
        "total_storage_gb": round(total_storage, 2),
    }


@router.get("/{backup_id}", response_model=BackupResponse)
def get_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get specific backup record details (Authenticated users)."""
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(status_code=404, detail="Backup not found")

    if backup.server_id:
        srv = db.query(Server).filter(Server.id == backup.server_id).first()
        if srv:
            setattr(backup, "server_name", srv.name)
    else:
        setattr(backup, "server_name", backup.system_name or "Host Node")

    return backup


@router.put("/{backup_id}", response_model=BackupResponse)
def update_backup(
    backup_id: int,
    backup_in: BackupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Update backup job record and re-evaluate alerts (Admin or Infra Manager only)."""
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(status_code=404, detail="Backup not found")

    update_data = backup_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            if field == "status":
                setattr(backup, field, val.upper())
            else:
                setattr(backup, field, val)

    db.commit()
    db.refresh(backup)

    if backup.status == "FAILED":
        trigger_backup_failure_alert(db, backup)
        db.commit()

    if backup.server_id:
        srv = db.query(Server).filter(Server.id == backup.server_id).first()
        if srv:
            setattr(backup, "server_name", srv.name)
    else:
        setattr(backup, "server_name", backup.system_name or "Host Node")

    return backup


@router.delete("/{backup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Delete a backup record (Admin or Infra Manager only)."""
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(status_code=404, detail="Backup not found")

    db.delete(backup)
    db.commit()
    return None
