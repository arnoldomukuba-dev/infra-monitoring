from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    server_id: Mapped[Optional[int]] = mapped_column(ForeignKey("servers.id", ondelete="CASCADE"), nullable=True)
    server_name: Mapped[str] = mapped_column(String(100), nullable=False)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)  # CPU, RAM, DISK, STATUS, HEARTBEAT
    severity: Mapped[str] = mapped_column(String(50), nullable=False)    # INFO, WARNING, CRITICAL
    message: Mapped[str] = mapped_column(Text, nullable=False)
    current_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    threshold_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE")    # ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="alerts")
