# backend/app/routers/groups.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.group import Group as GroupModel
from app.schemas.group import GroupResponse


router = APIRouter(prefix="/groups", tags=["groups"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[GroupResponse])
def get_groups(db: Session = Depends(get_db)):
    """Lista todos os grupos geradores"""
    groups = db.query(GroupModel).filter(GroupModel.active == True).all()
    return groups


@router.get("/{code}", response_model=GroupResponse)
def get_group_by_code(code: str, db: Session = Depends(get_db)):
    """Obtém um grupo específico pelo código (GG1, GG2, ...)"""
    group = db.query(GroupModel).filter(GroupModel.code == code).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"Grupo {code} não encontrado")
    return group