from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(50), default="INFO", index=True)  # INFO, WARNING, CRITICAL
    message: Mapped[str] = mapped_column(Text, nullable=False)
    server_id: Mapped[Optional[int]] = mapped_column(ForeignKey("servers.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    extra_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="audit_logs")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
