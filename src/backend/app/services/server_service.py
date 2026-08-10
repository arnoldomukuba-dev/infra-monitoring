import time
from datetime import datetime, timezone, timedelta
import psutil
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.server import Server, ServerMetric
from app.models.alert import Alert
from app.models.backup import Backup
from app.schemas.server import ServerCreate, ServerUpdate, ServerMetricCreate
from app.services.log_service import create_audit_log


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_uptime_str() -> str:
    boot_time = datetime.fromtimestamp(psutil.boot_time(), tz=timezone.utc)
    uptime = datetime.now(timezone.utc) - boot_time
    days = uptime.days
    hours, remainder = divmod(uptime.seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    return f"{days}d {hours}h {minutes}m"


def determine_status(cpu: float, ram: float, disk: float, last_hb: Optional[datetime]) -> str:
    """A server that is actively sending heartbeats within 5 minutes is ONLINE."""
    if last_hb:
        hb_time = last_hb if last_hb.tzinfo else last_hb.replace(tzinfo=timezone.utc)
        if (utc_now() - hb_time) <= timedelta(minutes=5):
            return "ONLINE"
    return "OFFLINE"


def evaluate_and_update_alerts(db: Session, server: Server, cpu: float, ram: float, disk: float) -> None:
    """Evaluate server resource metrics against thresholds, preventing duplicate active alerts and auto-resolving cleared alerts."""
    
    conditions: List[Tuple[str, str, str, float, float]] = []

    if cpu >= 90.0:
        conditions.append(("CPU", "CRITICAL", f"CPU load critical ({cpu}% >= 90.0%) on {server.name}", cpu, 90.0))
    elif cpu >= 75.0:
        conditions.append(("CPU", "WARNING", f"CPU load warning ({cpu}% >= 75.0%) on {server.name}", cpu, 75.0))

    if ram >= 90.0:
        conditions.append(("RAM", "CRITICAL", f"RAM usage critical ({ram}% >= 90.0%) on {server.name}", ram, 90.0))
    elif ram >= 80.0:
        conditions.append(("RAM", "WARNING", f"RAM usage warning ({ram}% >= 80.0%) on {server.name}", ram, 80.0))

    if disk >= 90.0:
        conditions.append(("DISK", "CRITICAL", f"Disk storage critical ({disk}% >= 90.0%) on {server.name}", disk, 90.0))
    elif disk >= 85.0:
        conditions.append(("DISK", "WARNING", f"Disk storage warning ({disk}% >= 85.0%) on {server.name}", disk, 85.0))

    active_types = {cond[0]: cond for cond in conditions}
    metric_types = ["CPU", "RAM", "DISK"]

    now = utc_now()

    for atype in metric_types:
        existing_alert: Optional[Alert] = (
            db.query(Alert)
            .filter(
                Alert.server_id == server.id,
                Alert.alert_type == atype,
                Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])
            )
            .order_by(Alert.timestamp.desc())
            .first()
        )

        if atype in active_types:
            _, sev, msg, val, thresh = active_types[atype]
            if existing_alert:
                existing_alert.severity = sev
                existing_alert.message = msg
                existing_alert.current_value = val
                existing_alert.threshold_value = thresh
                existing_alert.timestamp = now
            else:
                new_alert = Alert(
                    server_id=server.id,
                    server_name=server.name,
                    alert_type=atype,
                    severity=sev,
                    message=msg,
                    current_value=val,
                    threshold_value=thresh,
                    status="ACTIVE",
                    created_at=now,
                    timestamp=now,
                )
                db.add(new_alert)

                create_audit_log(
                    db,
                    event_type="ALERT_CREATED",
                    severity=sev,
                    message=msg,
                    server_id=server.id,
                )
                create_audit_log(
                    db,
                    event_type="METRIC_THRESHOLD_EXCEEDED",
                    severity=sev,
                    message=f"{atype} threshold exceeded ({val}%) on {server.name}",
                    server_id=server.id,
                )
                from app.services import notification_service
                notification_service.create_notification(
                    db=db,
                    notification_type=f"ALERT_{sev.upper()}",
                    title=f"{sev.upper()} Alert on {server.name}",
                    message=msg,
                    severity=sev,
                    server_id=server.id,
                    alert_id=new_alert.id,
                )
        else:
            if existing_alert:
                existing_alert.status = "RESOLVED"
                existing_alert.resolved_at = now

    check_missed_backup_alert(db, server)
    db.commit()


def check_missed_backup_alert(db: Session, server: Server) -> None:
    """Trigger a WARNING alert if server has missed its scheduled backup interval (24 hours)."""
    now = utc_now()
    cutoff_24h = now - timedelta(hours=24)

    last_successful_backup = (
        db.query(Backup)
        .filter(
            Backup.server_id == server.id,
            Backup.status.in_(["SUCCESS", "SUCCESSFUL"])
        )
        .order_by(Backup.created_at.desc())
        .first()
    )

    is_missing = False
    if not last_successful_backup:
        if server.created_at:
            created_tz = server.created_at if server.created_at.tzinfo else server.created_at.replace(tzinfo=timezone.utc)
            if (now - created_tz) > timedelta(hours=24):
                is_missing = True
    else:
        completed_tz = last_successful_backup.completed_at or last_successful_backup.created_at
        if completed_tz:
            c_tz = completed_tz if completed_tz.tzinfo else completed_tz.replace(tzinfo=timezone.utc)
            if c_tz < cutoff_24h:
                is_missing = True

    existing_backup_warning = (
        db.query(Alert)
        .filter(
            Alert.server_id == server.id,
            Alert.alert_type == "BACKUP",
            Alert.severity == "WARNING",
            Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])
        )
        .first()
    )

    msg = f"No successful backup completed for {server.name} in the last 24 hours."

    if is_missing:
        if existing_backup_warning:
            existing_backup_warning.timestamp = now
        else:
            warn_alert = Alert(
                server_id=server.id,
                server_name=server.name,
                alert_type="BACKUP",
                severity="WARNING",
                message=msg,
                status="ACTIVE",
                created_at=now,
                timestamp=now,
            )
            db.add(warn_alert)
    else:
        if existing_backup_warning:
            existing_backup_warning.status = "RESOLVED"
            existing_backup_warning.resolved_at = now


def create_server(db: Session, server_in: ServerCreate) -> Server:
    now = utc_now()
    server = Server(
        name=server_in.name,
        host=server_in.host,
        os=server_in.os or "Ubuntu 22.04 LTS",
        description=server_in.description,
        status="ONLINE",
        last_heartbeat=now,
        created_at=now,
        updated_at=now,
    )
    db.add(server)
    db.commit()
    db.refresh(server)

    create_audit_log(
        db,
        event_type="SERVER_REGISTERED",
        severity="INFO",
        message=f"Monitored server node '{server.name}' ({server.host}) registered successfully",
        server_id=server.id,
    )

    # Immediately collect initial metric
    record_host_metrics_for_server(db, server)
    return server


def get_all_servers(db: Session) -> List[Server]:
    servers: List[Server] = db.query(Server).all()
    now = utc_now()

    for s in servers:
        latest: Optional[ServerMetric] = (
            db.query(ServerMetric)
            .filter(ServerMetric.server_id == s.id)
            .order_by(ServerMetric.timestamp.desc())
            .first()
        )
        if latest:
            s.status = determine_status(latest.cpu_usage, latest.ram_usage, latest.disk_usage, s.last_heartbeat)
            setattr(s, "latest_metric", latest)
        elif s.last_heartbeat:
            hb_time = s.last_heartbeat if s.last_heartbeat.tzinfo else s.last_heartbeat.replace(tzinfo=timezone.utc)
            if (now - hb_time) > timedelta(minutes=5):
                s.status = "OFFLINE"

    db.commit()
    return servers


def get_server_by_id(db: Session, server_id: int) -> Optional[Server]:
    server: Optional[Server] = db.query(Server).filter(Server.id == server_id).first()
    if server:
        latest: Optional[ServerMetric] = (
            db.query(ServerMetric)
            .filter(ServerMetric.server_id == server.id)
            .order_by(ServerMetric.timestamp.desc())
            .first()
        )
        if latest:
            server.status = determine_status(latest.cpu_usage, latest.ram_usage, latest.disk_usage, server.last_heartbeat)
            setattr(server, "latest_metric", latest)
    return server


def update_server(db: Session, server_id: int, server_in: ServerUpdate) -> Optional[Server]:
    server: Optional[Server] = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        return None

    update_data = server_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(server, field, val)

    server.updated_at = utc_now()
    db.commit()
    db.refresh(server)
    return server


def delete_server(db: Session, server_id: int) -> bool:
    server: Optional[Server] = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        return False

    db.delete(server)
    db.commit()
    return True


def add_server_metric(db: Session, server_id: int, metric_in: ServerMetricCreate) -> ServerMetric:
    now = utc_now()
    metric = ServerMetric(
        server_id=server_id,
        cpu_usage=round(metric_in.cpu_usage, 1),
        ram_usage=round(metric_in.ram_usage, 1),
        ram_used_gb=round(metric_in.ram_used_gb, 2) if metric_in.ram_used_gb is not None else None,
        ram_total_gb=round(metric_in.ram_total_gb, 2) if metric_in.ram_total_gb is not None else None,
        disk_usage=round(metric_in.disk_usage, 1),
        disk_used_gb=round(metric_in.disk_used_gb, 2) if metric_in.disk_used_gb is not None else None,
        disk_total_gb=round(metric_in.disk_total_gb, 2) if metric_in.disk_total_gb is not None else None,
        network_sent_mb=round(metric_in.network_sent_mb, 2) if metric_in.network_sent_mb is not None else 0.0,
        network_recv_mb=round(metric_in.network_recv_mb, 2) if metric_in.network_recv_mb is not None else 0.0,
        uptime=metric_in.uptime or "N/A",
        timestamp=now,
    )
    db.add(metric)

    # Update server status and evaluate alerts
    server: Optional[Server] = db.query(Server).filter(Server.id == server_id).first()
    if server:
        server.last_heartbeat = now
        server.status = determine_status(metric.cpu_usage, metric.ram_usage, metric.disk_usage, server.last_heartbeat)
        evaluate_and_update_alerts(db, server, metric.cpu_usage, metric.ram_usage, metric.disk_usage)

    db.commit()
    db.refresh(metric)
    return metric


def get_server_metrics(db: Session, server_id: int, limit: int = 50) -> List[ServerMetric]:
    return (
        db.query(ServerMetric)
        .filter(ServerMetric.server_id == server_id)
        .order_by(ServerMetric.timestamp.desc())
        .limit(limit)
        .all()
    )


def record_host_metrics_for_server(db: Session, server: Server) -> ServerMetric:
    """Collect real system metrics from host OS using psutil."""
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net = psutil.net_io_counters()

    metric_in = ServerMetricCreate(
        cpu_usage=float(cpu),
        ram_usage=float(mem.percent),
        ram_used_gb=round(mem.used / (1024**3), 2),
        ram_total_gb=round(mem.total / (1024**3), 2),
        disk_usage=float(disk.percent),
        disk_used_gb=round(disk.used / (1024**3), 2),
        disk_total_gb=round(disk.total / (1024**3), 2),
        network_sent_mb=round(net.bytes_sent / (1024**2), 2),
        network_recv_mb=round(net.bytes_recv / (1024**2), 2),
        uptime=get_uptime_str(),
    )
    return add_server_metric(db, server.id, metric_in)


def get_servers_summary(db: Session) -> dict:
    servers = get_all_servers(db)
    total = len(servers)
    online = sum(1 for s in servers if s.status == "ONLINE")
    warning = sum(1 for s in servers if s.status == "WARNING")
    critical = sum(1 for s in servers if s.status == "CRITICAL")
    offline = sum(1 for s in servers if s.status == "OFFLINE")

    cpus: List[float] = [
        getattr(s, "latest_metric").cpu_usage
        for s in servers
        if hasattr(s, "latest_metric") and getattr(s, "latest_metric") is not None
    ]
    rams: List[float] = [
        getattr(s, "latest_metric").ram_usage
        for s in servers
        if hasattr(s, "latest_metric") and getattr(s, "latest_metric") is not None
    ]
    disks: List[float] = [
        getattr(s, "latest_metric").disk_usage
        for s in servers
        if hasattr(s, "latest_metric") and getattr(s, "latest_metric") is not None
    ]

    avg_cpu = round(sum(cpus) / len(cpus), 1) if cpus else 0.0
    avg_ram = round(sum(rams) / len(rams), 1) if rams else 0.0
    avg_disk = round(sum(disks) / len(disks), 1) if disks else 0.0

    return {
        "total_servers": total,
        "online_servers": online,
        "warning_servers": warning,
        "critical_servers": critical,
        "offline_servers": offline,
        "avg_cpu_usage": avg_cpu,
        "avg_ram_usage": avg_ram,
        "avg_disk_usage": avg_disk,
    }
