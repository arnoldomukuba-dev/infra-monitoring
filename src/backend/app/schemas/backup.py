from datetime import datetime
from typing import Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


class BackupBase(BaseModel):
    backup_name: str
    backup_type: Optional[str] = "FULL"
    source: Optional[str] = "/var/data"
    destination: Optional[str] = "s3://odri-backups/"
    status: Optional[str] = "SUCCESS"  # SUCCESS, FAILED, RUNNING, WARNING
    size: Optional[str] = "1.5 GB"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[str] = "12m 45s"
    error_message: Optional[str] = None
    server_id: Optional[int] = None
    system_name: Optional[str] = None
    file_name: Optional[str] = None
    storage_location: Optional[str] = None


class BackupCreate(BackupBase):
    pass


class BackupUpdate(BaseModel):
    backup_name: Optional[str] = None
    backup_type: Optional[str] = None
    source: Optional[str] = None
    destination: Optional[str] = None
    status: Optional[str] = None
    size: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[str] = None
    error_message: Optional[str] = None
    server_id: Optional[int] = None


class BackupResponse(BackupBase):
    id: int
    created_at: datetime
    server_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BackupSummaryResponse(BaseModel):
    total_backups: int
    successful_backups: int
    failed_backups: int
    running_backups: int
    warning_backups: int
    success_percentage: str
    total_storage_gb: float
