from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationSummaryResponse,
    NotificationSettingSchema,
    NotificationSettingUpdate,
)
from app.services import notification_service, email_service
from app.core.dependencies import get_current_user_strict, require_roles

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    severity: Optional[str] = Query(None, description="Filter by severity: INFO, WARNING, CRITICAL"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Retrieve notifications for the current authenticated user."""
    return notification_service.get_user_notifications(
        db, user=current_user, is_read=is_read, severity=severity, limit=limit
    )


@router.get("/summary", response_model=NotificationSummaryResponse)
def get_notification_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get unread and total notification counters."""
    return notification_service.get_user_notification_summary(db, user=current_user)


@router.get("/settings", response_model=List[NotificationSettingSchema])
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Get system notification settings."""
    return notification_service.get_notification_settings(db)


@router.put("/settings", response_model=List[NotificationSettingSchema])
def update_notification_settings(
    body: NotificationSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Update system notification settings (Admin restricted)."""
    return notification_service.update_notification_settings(db, body.settings)


@router.get("/email-status")
def get_email_status(
    current_user: User = Depends(require_roles("ADMIN")),
):
    """Get safe SMTP email configuration summary (Admin restricted)."""
    return email_service.get_email_status_summary()


@router.get("/{id}", response_model=NotificationResponse)
def get_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Retrieve single notification by ID."""
    notifications = notification_service.get_user_notifications(db, user=current_user, limit=500)
    for n in notifications:
        if n.id == id:
            return n
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")


@router.post("/{id}/read", response_model=NotificationResponse)
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Mark single notification as read."""
    notif = notification_service.mark_notification_as_read(db, notification_id=id, user=current_user)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif


@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Mark all unread notifications as read for current user."""
    count = notification_service.mark_all_notifications_as_read(db, user=current_user)
    return {"message": "All notifications marked as read", "count": count}


@router.delete("/{id}")
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    """Delete a notification."""
    success = notification_service.delete_notification(db, notification_id=id, user=current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return {"message": f"Notification #{id} deleted successfully"}
