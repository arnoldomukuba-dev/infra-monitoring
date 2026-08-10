from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AlertBase(BaseModel):
    server_name: str
    alert_type: str
    severity: str
    message: str
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None
    status: Optional[str] = "ACTIVE"
    server_id: Optional[int] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    timestamp: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AlertSummaryResponse(BaseModel):
    total_active: int
    critical_active: int
    warning_active: int
    info_active: int
