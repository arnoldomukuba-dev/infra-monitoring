from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    event_type: str
    severity: str = "INFO"
    message: str
    server_id: Optional[int] = None
    user_id: Optional[int] = None
    extra_metadata: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime
    server_name: Optional[str] = None
    user_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedAuditLogsResponse(BaseModel):
    total_count: int
    page: int
    limit: int
    total_pages: int
    logs: List[AuditLogResponse]
