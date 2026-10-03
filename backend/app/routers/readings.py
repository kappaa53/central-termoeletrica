# backend/app/routers/readings.py
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.group import Group as GroupModel
from app.models.operational_reading import OperationalReading as ReadingModel
from app.schemas.reading import OperationalReadingResponse, ReadingPage


router = APIRouter(prefix="/readings", tags=["readings"])


@router.get("/", response_model=ReadingPage)
def get_readings(
    group_id: Optional[int] = Query(None, description="Filtrar por ID do grupo"),
    group_code: Optional[str] = Query(None, description="Filtrar por código do grupo (GG1, ...)"),
    status: Optional[str] = Query(None, description="Filtrar por estado (Em operação, Parado, Manutenção)"),
    start: Optional[datetime] = Query(None, description="Data/hora inicial (inclusive)"),
    end: Optional[datetime] = Query(None, description="Data/hora final (inclusive)"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registos"),
    offset: int = Query(0, ge=0, description="Registos a saltar (paginação)"),
    db: Session = Depends(get_db),
):
    """Lista leituras operacionais com filtros e paginação"""
    filters = []
    if group_id is not None:
        filters.append(ReadingModel.group_id == group_id)
    if group_code:
        filters.append(GroupModel.code == group_code)
    if status:
        filters.append(ReadingModel.status == status)
    if start:
        filters.append(ReadingModel.timestamp >= start)
    if end:
        filters.append(ReadingModel.timestamp <= end)

    base = select(ReadingModel).join(GroupModel).where(*filters)

    total = db.scalar(select(func.count()).select_from(base.subquery()))
    items = db.scalars(
        base.options(joinedload(ReadingModel.group))
        .order_by(desc(ReadingModel.timestamp), GroupModel.code)
        .limit(limit)
        .offset(offset)
    ).all()

    return ReadingPage(items=items, total=total or 0, limit=limit, offset=offset)


@router.get("/latest", response_model=Optional[OperationalReadingResponse])
def get_latest_reading(
    group_id: int = Query(..., description="ID do grupo"),
    db: Session = Depends(get_db),
):
    """Obtém a leitura mais recente de um grupo específico"""
    return db.scalars(
        select(ReadingModel)
        .options(joinedload(ReadingModel.group))
        .where(ReadingModel.group_id == group_id)
        .order_by(desc(ReadingModel.timestamp))
        .limit(1)
    ).first()
