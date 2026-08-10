from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models.log import AuditLog


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_audit_log(
    db: Session,
    event_type: str,
    severity: str,
    message: str,
    server_id: Optional[int] = None,
    user_id: Optional[int] = None,
    extra_metadata: Optional[str] = None
) -> AuditLog:
    """Utility function to append an audit log entry into PostgreSQL."""
    now = utc_now()
    log_entry = AuditLog(
        event_type=event_type,
        severity=severity.upper(),
        message=message,
        server_id=server_id,
        user_id=user_id,
        extra_metadata=extra_metadata,
        created_at=now,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
