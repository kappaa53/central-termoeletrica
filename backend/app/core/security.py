# backend/app/core/security.py
"""Hash de palavras-passe (bcrypt) e tokens de acesso (JWT)."""
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    # bcrypt só considera os primeiros 72 bytes
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int, role: str) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    token = jwt.encode(
        {"sub": str(user_id), "role": role, "exp": expires_at},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )
    return token, expires_at


def decode_access_token(token: str) -> int | None:
    """Devolve o id do utilizador, ou None se o token for inválido/expirado."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None
