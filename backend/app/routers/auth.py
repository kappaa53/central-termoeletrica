# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import LoginRequest, LoginResponse, PasswordChange, UserResponse
from app.services.alert_engine import now


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Autentica e devolve um token de acesso"""
    user = db.scalars(
        select(User)
        .options(joinedload(User.role))
        .where(func.lower(User.username) == body.username.strip().lower())
    ).first()

    # Mesma mensagem para utilizador inexistente e palavra-passe errada
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilizador ou palavra-passe incorretos.")
    if not user.active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta desativada. Contacte o administrador.")

    user.last_login_at = now()
    db.commit()
    db.refresh(user)

    token, expires_at = create_access_token(user.id, user.role.name)
    return LoginResponse(access_token=token, expires_at=expires_at, user=user)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Utilizador autenticado"""
    return user


@router.post("/me/password", status_code=204)
def change_password(
    body: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Altera a palavra-passe do próprio utilizador"""
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=422, detail="A palavra-passe atual está incorreta.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
