from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Server(Base):
    __tablename__ = "servers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    host: Mapped[str] = mapped_column(String(255), nullable=False)
    os: Mapped[str] = mapped_column(String(100), default="Ubuntu 22.04 LTS")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ONLINE")  # ONLINE, OFFLINE
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    metrics: Mapped[List["ServerMetric"]] = relationship("ServerMetric", back_populates="server", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="server", cascade="all, delete-orphan")
    backups: Mapped[List["Backup"]] = relationship("Backup", back_populates="server", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="server", cascade="all, delete-orphan")


class ServerMetric(Base):
    __tablename__ = "server_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    server_id: Mapped[int] = mapped_column(ForeignKey("servers.id", ondelete="CASCADE"), nullable=False)
    cpu_usage: Mapped[float] = mapped_column(Float, nullable=False)
    ram_usage: Mapped[float] = mapped_column(Float, nullable=False)
    ram_used_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ram_total_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    disk_usage: Mapped[float] = mapped_column(Float, nullable=False)
    disk_used_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    disk_total_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    network_sent_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    network_recv_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    uptime: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="N/A")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    server: Mapped["Server"] = relationship("Server", back_populates="metrics")
