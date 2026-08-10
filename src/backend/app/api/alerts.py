from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertSummaryResponse
from app.services.log_service import create_audit_log
from app.core.dependencies import get_operator_or_above, get_infra_manager_or_admin, get_current_user_strict

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: INFO, WARNING, CRITICAL"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: ACTIVE, ACKNOWLEDGED, RESOLVED"),
    server_id: Optional[int] = Query(None, description="Filter by server ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """List infrastructure system alerts with optional severity, status, and server filters (Authenticated users)."""
    query = db.query(Alert)

    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity.upper())

    if status_filter and status_filter != "ALL":
        query = query.filter(Alert.status == status_filter.upper())

    if server_id is not None:
        query = query.filter(Alert.server_id == server_id)

    return query.order_by(Alert.timestamp.desc()).limit(limit).all()


@router.get("/summary", response_model=AlertSummaryResponse)
def get_alerts_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get active alerts summary counts by severity (Authenticated users)."""
    active_alerts = db.query(Alert).filter(Alert.status != "RESOLVED").all()
    total = len(active_alerts)
    critical = sum(1 for a in active_alerts if a.severity == "CRITICAL")
    warning = sum(1 for a in active_alerts if a.severity == "WARNING")
    info = sum(1 for a in active_alerts if a.severity == "INFO")

    return {
        "total_active": total,
        "critical_active": critical,
        "warning_active": warning,
        "info_active": info,
    }


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_by_id(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get specific alert details (Authenticated users)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_or_above)
):
    """Mark an alert status as ACKNOWLEDGED (Operator or above)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    create_audit_log(
        db,
        event_type="ALERT_ACKNOWLEDGED",
        severity="INFO",
        message=f"Alert #{alert.id} ({alert.alert_type}) acknowledged for server '{alert.server_name}' by '{current_user.username}'",
        server_id=getattr(alert, "server_id", None),
        user_id=int(getattr(current_user, "id")),
    )
    from app.services import notification_service
    notification_service.create_notification(
        db=db,
        notification_type="ALERT_ACKNOWLEDGED",
        title=f"Alert Acknowledged: #{alert.id}",
        message=f"Alert #{alert.id} for {alert.server_name} acknowledged by {current_user.username}",
        severity="INFO",
        server_id=getattr(alert, "server_id", None),
        alert_id=int(getattr(alert, "id")),
    )

    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_or_above)
):
    """Mark an alert status as RESOLVED (Operator or above)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    create_audit_log(
        db,
        event_type="ALERT_RESOLVED",
        severity="INFO",
        message=f"Alert #{alert.id} ({alert.alert_type}) resolved for server '{alert.server_name}' by '{current_user.username}'",
        server_id=getattr(alert, "server_id", None),
        user_id=int(getattr(current_user, "id")),
    )
    from app.services import notification_service
    notification_service.create_notification(
        db=db,
        notification_type="ALERT_RESOLVED",
        title=f"Alert Resolved: #{alert.id}",
        message=f"Alert #{alert.id} for {alert.server_name} resolved by {current_user.username}",
        severity="INFO",
        server_id=getattr(alert, "server_id", None),
        alert_id=int(getattr(alert, "id")),
    )

    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Delete an alert record (Infra Manager or Admin)."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return None
