from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.server import (
    ServerCreate,
    ServerUpdate,
    ServerResponse,
    ServerMetricCreate,
    ServerMetricResponse,
    ServerSummaryResponse,
)
from app.services import server_service
from app.core.dependencies import get_infra_manager_or_admin, get_current_user_strict, get_operator_or_above

router = APIRouter(prefix="/servers", tags=["Servers"])


@router.post("/", response_model=ServerResponse, status_code=status.HTTP_201_CREATED)
def create_server(
    server_in: ServerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Register a new monitored server node (Admin or Infra Manager only)."""
    return server_service.create_server(db, server_in)


@router.get("/", response_model=List[ServerResponse])
def get_servers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict)
):
    """List all monitored servers with latest telemetry metrics (Authenticated users)."""
    return server_service.get_all_servers(db)


@router.get("/summary", response_model=ServerSummaryResponse)
def get_servers_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict)
):
    """Get aggregated server health and telemetry metrics for the dashboard (Authenticated users)."""
    return server_service.get_servers_summary(db)


@router.get("/{server_id}", response_model=ServerResponse)
def get_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict)
):
    """Get detailed information for a single monitored server (Authenticated users)."""
    server = server_service.get_server_by_id(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server node not found")
    return server


@router.put("/{server_id}", response_model=ServerResponse)
def update_server(
    server_id: int,
    server_in: ServerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Update server configuration parameters (Admin or Infra Manager only)."""
    server = server_service.update_server(db, server_id, server_in)
    if not server:
        raise HTTPException(status_code=404, detail="Server node not found")
    return server


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_infra_manager_or_admin)
):
    """Remove a server node and its metrics history (Admin or Infra Manager only)."""
    success = server_service.delete_server(db, server_id)
    if not success:
        raise HTTPException(status_code=404, detail="Server node not found")
    return None


@router.get("/{server_id}/metrics", response_model=List[ServerMetricResponse])
def get_server_metrics(
    server_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_strict)
):
    """Get historical metrics time-series for a server (Authenticated users)."""
    server = server_service.get_server_by_id(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server node not found")
    return server_service.get_server_metrics(db, server_id, limit)


@router.post("/{server_id}/heartbeat", response_model=ServerMetricResponse)
def post_server_heartbeat(server_id: int, metric_in: ServerMetricCreate, db: Session = Depends(get_db)):
    """Post heartbeat / push telemetry metrics for a server (Agent endpoint)."""
    server = server_service.get_server_by_id(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server node not found")
    return server_service.add_server_metric(db, server_id, metric_in)


@router.post("/{server_id}/collect", response_model=ServerMetricResponse)
def collect_host_metrics(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_or_above)
):
    """Collect real system metrics from host OS via psutil for server (Operator or above)."""
    server = server_service.get_server_by_id(db, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server node not found")
    return server_service.record_host_metrics_for_server(db, server)
