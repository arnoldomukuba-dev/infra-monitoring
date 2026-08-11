from datetime import datetime
from typing import Optional, List
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    type: str
    title: str
    message: str
    severity: str = "INFO"
    related_server_id: Optional[int] = None
    related_alert_id: Optional[int] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    type: str
    title: str
    message: str
    severity: str
    related_server_id: Optional[int] = None
    related_alert_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    server_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationSummaryResponse(BaseModel):
    unread_count: int
    total_count: int


class NotificationSettingSchema(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationSettingUpdate(BaseModel):
    settings: List[dict]  # list of {"key": "...", "value": "..."}
