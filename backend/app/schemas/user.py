# backend/app/schemas/user.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

RoleName = Literal["ADMIN", "GESTOR", "OPERADOR"]

PASSWORD_MIN = 8


class RoleResponse(BaseModel):
    id: int
    name: RoleName
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: RoleResponse
    active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserResponse


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=PASSWORD_MIN, max_length=72)


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-z0-9._-]+$")
    role: RoleName
    password: str = Field(min_length=PASSWORD_MIN, max_length=72)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    role: Optional[RoleName] = None
    active: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str = Field(min_length=PASSWORD_MIN, max_length=72)
