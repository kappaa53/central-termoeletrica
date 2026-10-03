from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import engine
from app.routers import (
    alerts,
    auth,
    dashboard,
    groups,
    incidents,
    maintenance,
    readings,
    thresholds,
    users,
)


app = FastAPI(
    title="Sistema de Apoio à Decisão - Central Termoelétrica",
    version="0.1.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Autenticação (pública) e gestão de utilizadores (administradores)
app.include_router(auth.router)
app.include_router(users.router)

# Restantes routers: exigem sessão iniciada
authenticated = [Depends(get_current_user)]
for module in (groups, readings, dashboard, alerts, thresholds, incidents, maintenance):
    app.include_router(module.router, dependencies=authenticated)


@app.get("/")
def root():
    return {
        "message": "API da Central Termoelétrica funcionando"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(error),
        }