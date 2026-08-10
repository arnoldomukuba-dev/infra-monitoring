from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.backup import Backup
from app.models.user import User
from app.schemas.backup import BackupCreate, BackupResponse
from app.core.dependencies import (
    get_current_user,
    get_current_admin,
)

router = APIRouter(
    prefix="/backups",
    tags=["Backups"],
)


@router.post("/", response_model=BackupResponse)
def create_backup(
    backup: BackupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_backup = Backup(**backup.model_dump())

    db.add(new_backup)
    db.commit()
    db.refresh(new_backup)

    return new_backup


@router.get("/", response_model=list[BackupResponse])
def get_backups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Backup).all()


@router.get("/{backup_id}", response_model=BackupResponse)
def get_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(
            status_code=404,
            detail="Backup not found",
        )

    return backup


@router.put("/{backup_id}", response_model=BackupResponse)
def update_backup(
    backup_id: int,
    backup_data: BackupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(
            status_code=404,
            detail="Backup not found",
        )

    backup.system_name = backup_data.system_name
    backup.file_name = backup_data.file_name
    backup.status = backup_data.status
    backup.upload_status = backup_data.upload_status
    backup.storage_location = backup_data.storage_location
    backup.error_message = backup_data.error_message

    db.commit()
    db.refresh(backup)

    return backup


@router.delete("/{backup_id}")
def delete_backup(
    backup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()

    if backup is None:
        raise HTTPException(
            status_code=404,
            detail="Backup not found",
        )

    db.delete(backup)
    db.commit()

    return {
        "message": "Backup deleted successfully"
    }


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Backup).count()
    successful = db.query(Backup).filter(
        Backup.status == "Success"
    ).count()
    failed = db.query(Backup).filter(
        Backup.status == "Failed"
    ).count()
    uploading = db.query(Backup).filter(
        Backup.upload_status == True
    ).count()

    success_rate = 0

    if total > 0:
        success_rate = round(
            (successful / total) * 100,
            2,
        )

    return {
        "total_backups": total,
        "successful_backups": successful,
        "failed_backups": failed,
        "uploaded_backups": uploading,
        "success_rate": f"{success_rate}%",
    }