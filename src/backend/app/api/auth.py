from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user, get_current_user_strict
from app.services.log_service import create_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Public user registration (defaults to READ_ONLY role)."""
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    role_val = (user.role or "READ_ONLY").upper()
    if role_val not in ["ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR", "READ_ONLY"]:
        role_val = "READ_ONLY"

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=role_val,
        is_admin=(role_val == "ADMIN"),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


from time import time

login_attempts = {}


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with JSON credentials and return JWT bearer token."""
    client_key = credentials.username.lower()
    now = time()

    # Clean old attempts (> 60s)
    if client_key in login_attempts:
        login_attempts[client_key] = [t for t in login_attempts[client_key] if now - t < 60]

    # Limit to 10 attempts per minute per account
    if len(login_attempts.get(client_key, [])) >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 1 minute.",
        )

    user = db.query(User).filter(User.username == credentials.username).first()
    hashed_pwd = str(getattr(user, "hashed_password", "")) if user else ""
    if not user or not verify_password(credentials.password, hashed_pwd):
        if client_key not in login_attempts:
            login_attempts[client_key] = []
        login_attempts[client_key].append(now)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})

    create_audit_log(
        db,
        event_type="USER_LOGIN",
        severity="INFO",
        message=f"User '{user.username}' ({user.role}) logged in successfully",
        user_id=int(getattr(user, "id")),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user_strict)):
    """Get authenticated user profile."""
    return current_user


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user_strict), db: Session = Depends(get_db)):
    """Record logout audit event."""
    create_audit_log(
        db,
        event_type="USER_LOGOUT",
        severity="INFO",
        message=f"User '{current_user.username}' logged out",
        user_id=int(getattr(current_user, "id")),
    )
    return {"message": "Logged out successfully"}