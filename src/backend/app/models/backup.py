from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Backup(Base):
    __tablename__ = "backups"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    server_id: Mapped[Optional[int]] = mapped_column(ForeignKey("servers.id", ondelete="SET NULL"), nullable=True)
    backup_name: Mapped[str] = mapped_column(String(255), nullable=False)
    backup_type: Mapped[str] = mapped_column(String(50), default="FULL")  # FULL, INCREMENTAL, DIFFERENTIAL, SYSTEM_STATE, DATABASE
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    destination: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="SUCCESS")    # SUCCESS, FAILED, RUNNING, WARNING
    size: Mapped[Optional[str]] = mapped_column(String(50), default="1.5 GB")
    size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration: Mapped[Optional[str]] = mapped_column(String(50), default="12m 45s")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Compatibility fields for legacy table columns
    system_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    storage_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    server: Mapped[Optional["Server"]] = relationship("Server", back_populates="backups")
