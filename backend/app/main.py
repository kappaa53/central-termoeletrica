from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine


app = FastAPI(
    title="Sistema de Apoio à Decisão - Central Termoelétrica",
    version="0.1.0",
)


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