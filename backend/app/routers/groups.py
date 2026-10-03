# backend/app/routers/groups.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.group import Group as GroupModel
from app.models.operational_reading import OperationalReading as ReadingModel
from app.schemas.group import GroupResponse
from app.schemas.reading import OperationalReadingResponse


router = APIRouter(prefix="/groups", tags=["groups"])


def get_group_or_404(code: str, db: Session) -> GroupModel:
    group = db.scalars(select(GroupModel).where(GroupModel.code == code)).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"Grupo {code} não encontrado")
    return group


@router.get("/", response_model=List[GroupResponse])
def get_groups(db: Session = Depends(get_db)):
    """Lista todos os grupos geradores"""
    return db.scalars(
        select(GroupModel).where(GroupModel.active.is_(True)).order_by(GroupModel.id)
    ).all()


@router.get("/{code}", response_model=GroupResponse)
def get_group_by_code(code: str, db: Session = Depends(get_db)):
    """Obtém um grupo específico pelo código (GG1, GG2, ...)"""
    return get_group_or_404(code, db)


@router.get("/{code}/readings", response_model=List[OperationalReadingResponse])
def get_group_readings(
    code: str,
    limit: int = Query(24, ge=1, le=1000, description="Número máximo de registos"),
    db: Session = Depends(get_db),
):
    """Leituras mais recentes de um grupo (ordem decrescente de data)"""
    group = get_group_or_404(code, db)
    return db.scalars(
        select(ReadingModel)
        .options(joinedload(ReadingModel.group))
        .where(ReadingModel.group_id == group.id)
        .order_by(desc(ReadingModel.timestamp))
        .limit(limit)
    ).all()


@router.get("/{code}/readings/latest", response_model=Optional[OperationalReadingResponse])
def get_group_latest_reading(code: str, db: Session = Depends(get_db)):
    """Leitura mais recente de um grupo"""
    group = get_group_or_404(code, db)
    return db.scalars(
        select(ReadingModel)
        .options(joinedload(ReadingModel.group))
        .where(ReadingModel.group_id == group.id)
        .order_by(desc(ReadingModel.timestamp))
        .limit(1)
    ).first()
