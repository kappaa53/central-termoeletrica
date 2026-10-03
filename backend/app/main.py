from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.routers import (
    alerts,
    dashboard,
    groups,
    incidents,
    maintenance,
    readings,
    thresholds,
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

# Incluir os routers
app.include_router(groups.router)
app.include_router(readings.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(thresholds.router)
app.include_router(incidents.router)
app.include_router(maintenance.router)


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