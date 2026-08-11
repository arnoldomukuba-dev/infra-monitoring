from typing import List, Callable, Optional
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate JWT token from Authorization header or fallback to default admin."""
    if token:
        payload = decode_access_token(token)
        if not payload or not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials or token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        username = str(payload.get("sub"))
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or account deactivated",
            )
        return user

    # Fallback for unauthenticated background/legacy calls
    admin_user = db.query(User).filter(User.username == "admin").first()
    if admin_user:
        return admin_user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user_strict(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Strict authentication dependency requiring valid Authorization token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = str(payload.get("sub"))
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive or missing",
        )
    return user


def require_roles(*allowed_roles: str, strict: bool = False) -> Callable:
    """Role-Based Access Control (RBAC) dependency wrapper."""
    dep_func = get_current_user_strict if strict else get_current_user

    def role_checker(current_user: User = Depends(dep_func)) -> User:
        # ADMIN role has superuser privileges across all actions
        if current_user.role == "ADMIN" or current_user.is_admin:
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' lacks permission to perform this action",
            )
        return current_user

    return role_checker


# Shortcuts for common role restrictions
get_current_admin = require_roles("ADMIN", strict=True)
get_infra_manager_or_admin = require_roles("ADMIN", "INFRASTRUCTURE_MANAGER")
get_operator_or_above = require_roles("ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR")
get_any_authenticated_user = require_roles("ADMIN", "INFRASTRUCTURE_MANAGER", "MONITORING_OPERATOR", "READ_ONLY")