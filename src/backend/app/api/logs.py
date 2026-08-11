from datetime import datetime
from typing import Optional
import math
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import get_db
from app.models.log import AuditLog
from app.models.server import Server
from app.models.user import User
from app.schemas.log import AuditLogResponse, PaginatedAuditLogsResponse
from app.core.dependencies import get_current_user_strict

router = APIRouter(prefix="/logs", tags=["Audit Logs"])


@router.get("", response_model=PaginatedAuditLogsResponse)
@router.get("/", response_model=PaginatedAuditLogsResponse)
def list_logs(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
    server_id: Optional[int] = Query(None, description="Filter by server ID"),
    start_date: Optional[datetime] = Query(None, description="Filter start date"),
    end_date: Optional[datetime] = Query(None, description="Filter end date"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    query = db.query(AuditLog)

    if event_type and event_type.upper() != "ALL":
        query = query.filter(AuditLog.event_type == event_type.upper())

    if severity and severity.upper() != "ALL":
        query = query.filter(AuditLog.severity == severity.upper())

    if server_id and server_id != 0:
        query = query.filter(AuditLog.server_id == server_id)

    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)

    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)

    total_count = query.count()
    total_pages = max(1, math.ceil(total_count / limit))
    offset = (page - 1) * limit

    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()

    # Pre-fetch server names for display
    server_ids = {log.server_id for log in logs if log.server_id}
    server_map = {}
    if server_ids:
        servers = db.query(Server.id, Server.name).filter(Server.id.in_(server_ids)).all()
        server_map = {s.id: s.name for s in servers}

    response_logs = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "event_type": log.event_type,
            "severity": log.severity,
            "message": log.message,
            "server_id": log.server_id,
            "user_id": log.user_id,
            "extra_metadata": log.extra_metadata,
            "created_at": log.created_at,
            "server_name": server_map.get(log.server_id) if log.server_id else None,
            "user_name": None,
        }
        response_logs.append(AuditLogResponse.model_validate(log_dict))

    return PaginatedAuditLogsResponse(
        total_count=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        logs=response_logs,
    )


@router.get("/{log_id}", response_model=AuditLogResponse)
def get_log_by_id(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict),
):
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log entry not found")

    server_name = None
    if log.server_id:
        srv = db.query(Server).filter(Server.id == log.server_id).first()
        if srv:
            server_name = srv.name

    log_dict = {
        "id": log.id,
        "event_type": log.event_type,
        "severity": log.severity,
        "message": log.message,
        "server_id": log.server_id,
        "user_id": log.user_id,
        "extra_metadata": log.extra_metadata,
        "created_at": log.created_at,
        "server_name": server_name,
        "user_name": None,
    }
    return AuditLogResponse.model_validate(log_dict)
