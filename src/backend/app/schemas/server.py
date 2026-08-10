from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ServerBase(BaseModel):
    name: str
    host: str
    os: Optional[str] = "Ubuntu 22.04 LTS"
    description: Optional[str] = None


class ServerCreate(ServerBase):
    pass


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    os: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ServerMetricBase(BaseModel):
    cpu_usage: float
    ram_usage: float
    ram_used_gb: Optional[float] = None
    ram_total_gb: Optional[float] = None
    disk_usage: float
    disk_used_gb: Optional[float] = None
    disk_total_gb: Optional[float] = None
    network_sent_mb: Optional[float] = 0.0
    network_recv_mb: Optional[float] = 0.0
    uptime: Optional[str] = "N/A"


class ServerMetricCreate(ServerMetricBase):
    pass


class ServerMetricResponse(ServerMetricBase):
    id: int
    server_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ServerResponse(ServerBase):
    id: int
    status: str
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
    latest_metric: Optional[ServerMetricResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ServerSummaryResponse(BaseModel):
    total_servers: int
    online_servers: int
    warning_servers: int
    critical_servers: int
    offline_servers: int
    avg_cpu_usage: float
    avg_ram_usage: float
    avg_disk_usage: float
