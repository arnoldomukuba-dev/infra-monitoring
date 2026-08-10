from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), nullable=False, default="INFO")
    related_server_id = Column(Integer, ForeignKey("servers.id"), nullable=True)
    related_alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True)
    is_read = Column(Boolean, default=False, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", backref="notifications")
    server = relationship("Server", backref="notifications")
    alert = relationship("Alert", backref="notifications")


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
