# backend/app/routers/thresholds.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import MANAGEMENT, require_roles
from app.core.database import get_db
from app.models.alert_threshold import AlertThreshold
from app.schemas.alert import ThresholdResponse, ThresholdUpdate


router = APIRouter(prefix="/thresholds", tags=["thresholds"])


@router.get("/", response_model=List[ThresholdResponse])
def list_thresholds(db: Session = Depends(get_db)):
    """Limites de alarme configurados"""
    return db.scalars(select(AlertThreshold).order_by(AlertThreshold.id)).all()


@router.put(
    "/{threshold_id}",
    response_model=ThresholdResponse,
    dependencies=[Depends(require_roles(*MANAGEMENT))],
)
def update_threshold(threshold_id: int, body: ThresholdUpdate, db: Session = Depends(get_db)):
    """Atualiza os limites de um parâmetro"""
    t = db.get(AlertThreshold, threshold_id)
    if not t:
        raise HTTPException(status_code=404, detail="Limite não encontrado")

    if (
        body.warning_max is not None
        and body.critical_max is not None
        and body.critical_max < body.warning_max
    ):
        raise HTTPException(status_code=422, detail="O máximo crítico deve ser ≥ ao máximo de aviso")
    if (
        body.warning_min is not None
        and body.critical_min is not None
        and body.critical_min > body.warning_min
    ):
        raise HTTPException(status_code=422, detail="O mínimo crítico deve ser ≤ ao mínimo de aviso")

    for key, value in body.model_dump().items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return t
