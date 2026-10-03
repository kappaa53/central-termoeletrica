# backend/app/routers/readings.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.operational_reading import OperationalReading as ReadingModel
from app.schemas.reading import OperationalReadingResponse


router = APIRouter(prefix="/readings", tags=["readings"])


@router.get("/", response_model=List[OperationalReadingResponse])
def get_readings(
    group_id: Optional[int] = Query(None, description="Filtrar por ID do grupo"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    db: Session = Depends(get_db),
):
    """Lista leituras operacionais com filtros"""
    query = db.query(ReadingModel)
    
    if group_id is not None:
        query = query.filter(ReadingModel.group_id == group_id)
    
    readings = query.order_by(desc(ReadingModel.timestamp)).limit(limit).all()
    return readings


@router.get("/latest", response_model=Optional[OperationalReadingResponse])
def get_latest_reading(
    group_id: int = Query(..., description="ID do grupo"),
    db: Session = Depends(get_db),
):
    """Obtém a leitura mais recente de um grupo específico"""
    reading = (
        db.query(ReadingModel)
        .filter(ReadingModel.group_id == group_id)
        .order_by(desc(ReadingModel.timestamp))
        .first()
    )
    return reading