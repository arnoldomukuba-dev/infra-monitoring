import os
import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine, SessionLocal

# Import models to ensure tables are registered in Base metadata
import app.models.backup
import app.models.log
from app.models.user import User
from app.models.server import Server
import app.models.alert
import app.models.notification

# Import routers
from app.api.backups import router as backup_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.servers import router as servers_router
from app.api.alerts import router as alerts_router
from app.api.logs import router as logs_router
from app.api.notifications import router as notifications_router
from app.services import server_service, notification_service
from app.core.security import get_password_hash, verify_password

# Create tables (during development)
Base.metadata.create_all(bind=engine)


async def background_monitoring_task():
    """Periodic background monitor loop collecting metrics for all registered servers."""
    while True:
        try:
            db = SessionLocal()
            servers = db.query(Server).all()
            for server in servers:
                try:
                    server_service.record_host_metrics_for_server(db, server)
                except Exception as ex:
                    print(f"Error collecting metrics for server {server.name}: {ex}")
            db.close()
        except Exception as e:
            print(f"Error in background monitoring task: {e}")
        await asyncio.sleep(20)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed default host server, default RBAC users & default notification settings
    db = SessionLocal()
    try:
        count = db.query(Server).count()
        if count == 0:
            print("Seeding initial local server node into PostgreSQL...")
            initial_server = Server(
                name="odri-host-node-01",
                host="127.0.0.1",
                os="Linux / Ubuntu 22.04 LTS",
                description="Primary ODRISYSTEMS Host Monitoring Node",
                status="ONLINE",
                last_heartbeat=datetime.now(timezone.utc)
            )
            db.add(initial_server)
            db.commit()
            db.refresh(initial_server)
            server_service.record_host_metrics_for_server(db, initial_server)

        # Seed RBAC users
        default_users = [
            ("admin", "admin@odrisystems.io", "admin123", "ADMIN"),
            ("manager", "manager@odrisystems.io", "manager123", "INFRASTRUCTURE_MANAGER"),
            ("operator", "operator@odrisystems.io", "operator123", "MONITORING_OPERATOR"),
            ("readonly", "readonly@odrisystems.io", "readonly123", "READ_ONLY"),
        ]

        for uname, uemail, upass, urole in default_users:
            u_exists = db.query(User).filter(User.username == uname).first()
            if not u_exists:
                db.add(User(
                    username=uname,
                    email=uemail,
                    hashed_password=get_password_hash(upass),
                    role=urole,
                    is_admin=(urole == "ADMIN"),
                    is_active=True
                ))
            elif uname == "admin":
                # Ensure existing admin account has correct credentials, ADMIN role and is_admin=True
                u_exists.email = uemail
                u_exists.role = "ADMIN"
                u_exists.is_admin = True
                u_exists.is_active = True
                u_exists.hashed_password = get_password_hash(upass)
        db.commit()

        # Seed notification settings
        notification_service.seed_default_notification_settings(db)

    except Exception as err:
        print("Error seeding initial application data:", err)
    finally:
        db.close()

    bg_task = asyncio.create_task(background_monitoring_task())
    yield
    bg_task.cancel()


from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


is_prod = os.getenv("ENVIRONMENT", "development").lower() == "production"

app = FastAPI(
    title="ODRISYSTEMS Infrastructure Monitoring API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
)

app.add_middleware(SecurityHeadersMiddleware)

cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000,http://127.0.0.1:5173"
)
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router)
app.include_router(backup_router)
app.include_router(users_router)
app.include_router(servers_router)
app.include_router(alerts_router)
app.include_router(logs_router)
app.include_router(notifications_router)


@app.get("/")
def root():
    return {
        "message": "ODRISYSTEMS Infrastructure Monitoring API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }