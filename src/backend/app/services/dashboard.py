from sqlalchemy.orm import Session
from app.models.backup import Backup


def get_dashboard_summary(db: Session):
    total = db.query(Backup).count()
    successful = db.query(Backup).filter(Backup.status == "Success").count()
    failed = db.query(Backup).filter(Backup.status == "Failed").count()
    uploaded = db.query(Backup).filter(Backup.upload_status == True).count()

    success_rate = 0

    if total > 0:
        success_rate = round((successful / total) * 100, 2)

    return {
        "total_backups": total,
        "successful_backups": successful,
        "failed_backups": failed,
        "uploaded_backups": uploaded,
        "success_rate": success_rate
    }o

