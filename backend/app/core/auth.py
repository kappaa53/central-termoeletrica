# backend/app/core/auth.py
"""Dependências de autenticação e autorização por perfil."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# Perfis (roles.name)
ROLE_ADMIN = "ADMIN"
ROLE_MANAGER = "GESTOR"
ROLE_OPERATOR = "OPERADOR"

MANAGEMENT = (ROLE_ADMIN, ROLE_MANAGER)

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão inválida ou expirada. Inicie sessão novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = db.get(User, user_id, options=[joinedload(User.role)])
    if user is None or not user.active:
        raise unauthorized
    return user


def require_roles(*roles: str):
    """Dependência que exige um dos perfis indicados."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role.name not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Não tem permissão para esta operação.",
            )
        return user

    return checker
