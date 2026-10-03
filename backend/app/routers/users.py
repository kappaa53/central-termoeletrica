# backend/app/routers/users.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.auth import ROLE_ADMIN, require_roles
from app.core.database import get_db
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.schemas.user import PasswordReset, RoleResponse, UserCreate, UserResponse, UserUpdate
from app.services.alert_engine import now


# Gestão de utilizadores: apenas administradores
router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_roles(ROLE_ADMIN))])


def get_role(name: str, db: Session) -> Role:
    role = db.scalars(select(Role).where(Role.name == name)).first()
    if not role:
        raise HTTPException(status_code=422, detail=f"Perfil {name} não existe")
    return role


def get_user_or_404(user_id: int, db: Session) -> User:
    user = db.get(User, user_id, options=[joinedload(User.role)])
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return user


def active_admins(db: Session) -> int:
    return db.scalar(
        select(func.count()).select_from(User).join(Role).where(Role.name == ROLE_ADMIN, User.active.is_(True))
    ) or 0


@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return db.scalars(select(Role).where(Role.active.is_(True)).order_by(Role.id)).all()


@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.scalars(select(User).options(joinedload(User.role)).order_by(User.name)).all()


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(User.id).where(func.lower(User.username) == body.username.lower()))
    if exists:
        raise HTTPException(status_code=409, detail=f"O utilizador '{body.username}' já existe")

    user = User(
        name=body.name.strip(),
        username=body.username.lower(),
        password_hash=hash_password(body.password),
        role=get_role(body.role, db),
        active=True,
        created_at=now(),
    )
    db.add(user)
    db.commit()
    return get_user_or_404(user.id, db)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)

    # Não deixar a aplicação sem administradores ativos
    loses_admin = user.role.name == ROLE_ADMIN and user.active and (
        (body.role is not None and body.role != ROLE_ADMIN) or body.active is False
    )
    if loses_admin and active_admins(db) <= 1:
        raise HTTPException(status_code=409, detail="Tem de existir pelo menos um administrador ativo")

    if body.name is not None:
        user.name = body.name.strip()
    if body.role is not None:
        user.role = get_role(body.role, db)
    if body.active is not None:
        user.active = body.active
    db.commit()
    return get_user_or_404(user_id, db)


@router.post("/{user_id}/password", status_code=204)
def reset_password(user_id: int, body: PasswordReset, db: Session = Depends(get_db)):
    """Define uma nova palavra-passe (ex.: utilizador esqueceu-se)"""
    user = get_user_or_404(user_id, db)
    user.password_hash = hash_password(body.new_password)
    db.commit()
