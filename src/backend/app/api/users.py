from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_password_hash
from app.core.dependencies import get_current_admin
from app.services.log_service import create_audit_log

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Retrieve list of registered users (Admin only)."""
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Create a new user account (Admin only)."""
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    role_val = (user_in.role or "READ_ONLY").upper()
    if role_val not in ["ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR", "READ_ONLY"]:
        role_val = "READ_ONLY"

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=role_val,
        is_admin=(role_val == "ADMIN"),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(
        db,
        event_type="SETTINGS_CHANGED",
        severity="INFO",
        message=f"Admin '{admin_user.username}' created user '{new_user.username}' with role '{new_user.role}'",
        user_id=int(getattr(admin_user, "id")),
    )

    return new_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Update user account parameters or role (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email is not None:
        user.email = user_in.email

    if user_in.role is not None:
        role_val = user_in.role.upper()
        if role_val in ["ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR", "READ_ONLY"]:
            user.role = role_val
            user.is_admin = (role_val == "ADMIN")

    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)

    create_audit_log(
        db,
        event_type="SETTINGS_CHANGED",
        severity="INFO",
        message=f"Admin '{admin_user.username}' updated user '{user.username}' (role: {user.role}, active: {user.is_active})",
        user_id=int(getattr(admin_user, "id")),
    )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    """Delete a user account by ID (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Superadmin cannot delete their own active account")

    username_deleted = user.username
    db.delete(user)
    db.commit()

    create_audit_log(
        db,
        event_type="SETTINGS_CHANGED",
        severity="WARNING",
        message=f"Admin '{admin_user.username}' deleted user account '{username_deleted}'",
        user_id=int(getattr(admin_user, "id")),
    )

    return {"message": f"User '{username_deleted}' deleted successfully"}
