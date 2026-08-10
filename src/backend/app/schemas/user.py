from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "READ_ONLY"
    is_active: bool = True
    is_admin: bool = False


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "READ_ONLY"


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_active: bool
    is_admin: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None