from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationSetting
from app.models.user import User
from app.models.server import Server
from app.services import email_service


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


DEFAULT_SETTINGS = [
    {"key": "email_notifications_enabled", "value": "true", "description": "Global SMTP email notifications toggle"},
    {"key": "notify_on_critical_alerts", "value": "true", "description": "Trigger notifications when CRITICAL alerts occur"},
    {"key": "notify_on_warning_alerts", "value": "true", "description": "Trigger notifications when WARNING alerts occur"},
    {"key": "notify_on_backup_failed", "value": "true", "description": "Trigger notifications when backup jobs fail"},
    {"key": "notify_on_server_offline", "value": "true", "description": "Trigger notifications when monitored servers go OFFLINE"},
]


def seed_default_notification_settings(db: Session) -> None:
    """Ensure default notification settings exist in database."""
    now = utc_now()
    for default in DEFAULT_SETTINGS:
        setting = db.query(NotificationSetting).filter(NotificationSetting.key == default["key"]).first()
        if not setting:
            db.add(NotificationSetting(
                key=default["key"],
                value=default["value"],
                description=default["description"],
                updated_at=now,
            ))
    db.commit()


def get_notification_settings(db: Session) -> List[NotificationSetting]:
    seed_default_notification_settings(db)
    return db.query(NotificationSetting).order_by(NotificationSetting.id.asc()).all()


def is_setting_enabled(db: Session, key: str) -> bool:
    setting = db.query(NotificationSetting).filter(NotificationSetting.key == key).first()
    if setting:
        return setting.value.lower() in ["true", "1", "yes", "on"]
    return True


def update_notification_settings(db: Session, settings_data: List[dict]) -> List[NotificationSetting]:
    now = utc_now()
    for item in settings_data:
        k = item.get("key")
        v = str(item.get("value", "")).lower()
        if k:
            setting = db.query(NotificationSetting).filter(NotificationSetting.key == k).first()
            if setting:
                setattr(setting, "value", v)
                setattr(setting, "updated_at", now)
            else:
                db.add(NotificationSetting(
                    key=k,
                    value=v,
                    description=item.get("description", ""),
                    updated_at=now,
                ))
    db.commit()
    return get_notification_settings(db)


def create_notification(
    db: Session,
    notification_type: str,
    title: str,
    message: str,
    severity: str = "INFO",
    server_id: Optional[int] = None,
    alert_id: Optional[int] = None,
    user_id: Optional[int] = None,
    target_roles: Optional[List[str]] = None,
) -> List[Notification]:
    """Create in-app notifications and trigger optional email notifications."""
    now = utc_now()
    severity_upper = severity.upper()

    # Determine target users
    target_users: List[User] = []
    if user_id:
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if user:
            target_users.append(user)
    else:
        query = db.query(User).filter(User.is_active == True)
        if target_roles:
            query = query.filter(User.role.in_(target_roles) | (User.role == "ADMIN"))
        target_users = query.all()

    if not target_users:
        # Fallback to creating a general broadcast notification without direct user_id
        target_users = [None]  # type: ignore

    created_notifications: List[Notification] = []
    cutoff_1m = now - timedelta(minutes=1)

    for target_user in target_users:
        uid = target_user.id if target_user else None

        # Duplicate check within 1 minute
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == uid,
                Notification.type == notification_type,
                Notification.title == title,
                Notification.related_server_id == server_id,
                Notification.created_at >= cutoff_1m,
            )
            .first()
        )

        if existing:
            continue

        notif = Notification(
            user_id=uid,
            type=notification_type,
            title=title,
            message=message,
            severity=severity_upper,
            related_server_id=server_id,
            related_alert_id=alert_id,
            is_read=False,
            created_at=now,
        )
        db.add(notif)
        created_notifications.append(notif)

    db.commit()

    for n in created_notifications:
        db.refresh(n)

    # Evaluate email dispatch
    should_send_email = is_setting_enabled(db, "email_notifications_enabled")
    if should_send_email:
        if notification_type in ["ALERT_CRITICAL", "SERVER_OFFLINE", "BACKUP_FAILED"] and not is_setting_enabled(db, "notify_on_critical_alerts"):
            should_send_email = False
        elif notification_type in ["ALERT_WARNING", "MISSED_BACKUP"] and not is_setting_enabled(db, "notify_on_warning_alerts"):
            should_send_email = False
        elif notification_type == "BACKUP_FAILED" and not is_setting_enabled(db, "notify_on_backup_failed"):
            should_send_email = False
        elif notification_type == "SERVER_OFFLINE" and not is_setting_enabled(db, "notify_on_server_offline"):
            should_send_email = False

    if should_send_email:
        email_subject = f"[{severity_upper}] ODRISYSTEMS Notification: {title}"
        email_body = f"Notification: {title}\nSeverity: {severity_upper}\nType: {notification_type}\n\nMessage:\n{message}\n\nTimestamp: {now.isoformat()}"

        for tu in target_users:
            if tu and getattr(tu, "email", None):
                email_addr = str(getattr(tu, "email"))
                email_service.send_email_notification(email_addr, email_subject, email_body)

    return created_notifications


def get_user_notifications(
    db: Session,
    user: User,
    is_read: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 50,
) -> List[Notification]:
    """Retrieve notifications accessible to the given user."""
    query = db.query(Notification).filter(
        (Notification.user_id == user.id) | (Notification.user_id == None)
    )

    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    if severity and severity != "ALL":
        query = query.filter(Notification.severity == severity.upper())

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    # Populate server_name dynamically
    for n in notifications:
        if n.related_server_id:
            srv = db.query(Server).filter(Server.id == n.related_server_id).first()
            if srv:
                setattr(n, "server_name", srv.name)

    return notifications


def get_user_notification_summary(db: Session, user: User) -> dict:
    """Get count of unread and total notifications for user."""
    user_filter = (Notification.user_id == user.id) | (Notification.user_id == None)
    unread = db.query(Notification).filter(user_filter, Notification.is_read == False).count()
    total = db.query(Notification).filter(user_filter).count()
    return {"unread_count": unread, "total_count": total}


def mark_notification_as_read(db: Session, notification_id: int, user: User) -> Optional[Notification]:
    """Mark single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        (Notification.user_id == user.id) | (Notification.user_id == None)
    ).first()

    if notif:
        setattr(notif, "is_read", True)
        db.commit()
        db.refresh(notif)
        if notif.related_server_id:
            srv = db.query(Server).filter(Server.id == notif.related_server_id).first()
            if srv:
                setattr(notif, "server_name", srv.name)
    return notif


def mark_all_notifications_as_read(db: Session, user: User) -> int:
    """Mark all unread notifications as read for current user."""
    unreads = db.query(Notification).filter(
        (Notification.user_id == user.id) | (Notification.user_id == None),
        Notification.is_read == False
    ).all()

    count = len(unreads)
    for n in unreads:
        setattr(n, "is_read", True)

    db.commit()
    return count


def delete_notification(db: Session, notification_id: int, user: User) -> bool:
    """Delete notification entry."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        (Notification.user_id == user.id) | (Notification.user_id == None)
    ).first()

    if notif:
        db.delete(notif)
        db.commit()
        return True
    return False
