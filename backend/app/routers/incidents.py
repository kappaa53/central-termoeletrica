# backend/app/routers/incidents.py
from datetime import timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, desc, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.alert import Alert
from app.models.group import Group
from app.models.user import User
from app.models.incident import (
    INCIDENT_OPEN_STATUSES,
    INCIDENT_STATUSES,
    INCIDENT_TRANSITIONS,
    Incident,
    IncidentUpdate,
)
from app.schemas.incident import (
    IncidentCreate,
    IncidentDetail,
    IncidentEdit,
    IncidentNote,
    IncidentPage,
    IncidentStatusChange,
    IncidentSummary,
)
from app.services.alert_engine import now


router = APIRouter(prefix="/incidents", tags=["incidents"])

SEVERITY_ORDER = case(
    (Incident.severity == "CRITICA", 0),
    (Incident.severity == "ALTA", 1),
    (Incident.severity == "MEDIA", 2),
    else_=3,
)


def get_incident_or_404(incident_id: int, db: Session) -> Incident:
    incident = db.get(
        Incident,
        incident_id,
        options=[
            joinedload(Incident.group),
            selectinload(Incident.updates),
            selectinload(Incident.maintenance_orders),
        ],
    )
    if not incident:
        raise HTTPException(status_code=404, detail=f"Ocorrência {incident_id} não encontrada")
    return incident


def get_group_by_code(code: str, db: Session) -> Group:
    group = db.scalars(select(Group).where(Group.code == code)).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"Grupo {code} não encontrado")
    return group


@router.get("/", response_model=IncidentPage)
def list_incidents(
    group_code: Optional[str] = Query(None),
    status: Optional[Literal["ABERTA", "EM_ANALISE", "EM_EXECUCAO", "RESOLVIDA", "FECHADA", "OPEN"]] = Query(
        None, description="OPEN = ABERTA + EM_ANALISE + EM_EXECUCAO"
    ),
    severity: Optional[Literal["BAIXA", "MEDIA", "ALTA", "CRITICA"]] = Query(None),
    type: Optional[Literal["ELETRICA", "MECANICA", "OPERACIONAL", "SEGURANCA", "OUTROS"]] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Lista ocorrências; as abertas e mais graves primeiro"""
    filters = []
    if group_code:
        filters.append(Group.code == group_code)
    if status == "OPEN":
        filters.append(Incident.status.in_(INCIDENT_OPEN_STATUSES))
    elif status:
        filters.append(Incident.status == status)
    if severity:
        filters.append(Incident.severity == severity)
    if type:
        filters.append(Incident.type == type)

    base = select(Incident).join(Group).where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0

    is_open = case((Incident.status.in_(INCIDENT_OPEN_STATUSES), 0), else_=1)
    items = db.scalars(
        base.options(joinedload(Incident.group))
        .order_by(is_open, SEVERITY_ORDER, desc(Incident.opened_at), desc(Incident.id))
        .limit(limit)
        .offset(offset)
    ).all()
    return IncidentPage(items=items, total=total, limit=limit, offset=offset)


@router.get("/summary", response_model=IncidentSummary)
def incidents_summary(db: Session = Depends(get_db)):
    """Indicadores das ocorrências"""
    by_status = dict.fromkeys(INCIDENT_STATUSES, 0)
    for status, count in db.execute(
        select(Incident.status, func.count()).group_by(Incident.status)
    ).all():
        by_status[status] = count

    critical_open = db.scalar(
        select(func.count()).where(
            Incident.status.in_(INCIDENT_OPEN_STATUSES), Incident.severity == "CRITICA"
        )
    ) or 0

    since = now() - timedelta(days=30)
    resolved = db.execute(
        select(Incident.opened_at, Incident.resolved_at).where(
            Incident.resolved_at.is_not(None), Incident.resolved_at >= since
        )
    ).all()
    avg_hours = (
        round(
            sum((r.resolved_at - r.opened_at).total_seconds() for r in resolved)
            / len(resolved)
            / 3600,
            1,
        )
        if resolved
        else None
    )

    return IncidentSummary(
        open=sum(by_status[s] for s in INCIDENT_OPEN_STATUSES),
        critical_open=critical_open,
        by_status=by_status,
        resolved_last_30d=len(resolved),
        avg_resolution_hours=avg_hours,
    )


@router.get("/{incident_id}", response_model=IncidentDetail)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Detalhe com cronologia e ordens de manutenção associadas"""
    return get_incident_or_404(incident_id, db)


@router.post("/", response_model=IncidentDetail, status_code=201)
def create_incident(
    body: IncidentCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Abre uma ocorrência (opcionalmente a partir de um alerta)"""
    group = get_group_by_code(body.group_code, db)

    if body.alert_id is not None:
        alert = db.get(Alert, body.alert_id)
        if not alert or alert.group_id != group.id:
            raise HTTPException(status_code=422, detail="O alerta indicado não pertence a este grupo")

    t = now()
    incident = Incident(
        group_id=group.id,
        alert_id=body.alert_id,
        title=body.title,
        type=body.type,
        severity=body.severity,
        status="ABERTA",
        description=body.description,
        operator=user.name,
        opened_at=t,
        created_at=t,
        updated_at=t,
    )
    incident.updates.append(
        IncidentUpdate(created_at=t, author=user.name, to_status="ABERTA", note="Ocorrência aberta")
    )
    db.add(incident)
    db.commit()
    return get_incident_or_404(incident.id, db)


@router.patch("/{incident_id}", response_model=IncidentDetail)
def edit_incident(incident_id: int, body: IncidentEdit, db: Session = Depends(get_db)):
    """Edita campos descritivos (título, tipo, severidade, causa, solução...)"""
    incident = get_incident_or_404(incident_id, db)
    if incident.status == "FECHADA":
        raise HTTPException(status_code=409, detail="Ocorrências fechadas não podem ser editadas")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(incident, key, value)
    incident.updated_at = now()
    db.commit()
    return get_incident_or_404(incident_id, db)


@router.post("/{incident_id}/status", response_model=IncidentDetail)
def change_status(
    incident_id: int,
    body: IncidentStatusChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Muda o estado respeitando o fluxo permitido"""
    incident = get_incident_or_404(incident_id, db)
    current = incident.status

    if body.status not in INCIDENT_TRANSITIONS[current]:
        raise HTTPException(
            status_code=409,
            detail=f"Transição inválida: {current} → {body.status}",
        )

    if body.cause is not None:
        incident.cause = body.cause
    if body.solution is not None:
        incident.solution = body.solution

    if body.status == "RESOLVIDA" and not (incident.solution or "").strip():
        raise HTTPException(status_code=422, detail="Indique a solução aplicada para resolver a ocorrência")

    t = now()
    incident.status = body.status
    incident.updated_at = t
    if body.status == "RESOLVIDA":
        incident.resolved_at = t
    elif body.status == "FECHADA":
        incident.closed_at = t
    elif body.status == "ABERTA":  # reaberta
        incident.resolved_at = None

    incident.updates.append(
        IncidentUpdate(
            created_at=t,
            author=user.name,
            from_status=current,
            to_status=body.status,
            note=body.note,
        )
    )
    db.commit()
    return get_incident_or_404(incident_id, db)


@router.post("/{incident_id}/notes", response_model=IncidentDetail)
def add_note(
    incident_id: int,
    body: IncidentNote,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Acrescenta uma nota à cronologia"""
    incident = get_incident_or_404(incident_id, db)
    t = now()
    incident.updates.append(IncidentUpdate(created_at=t, author=user.name, note=body.note))
    incident.updated_at = t
    db.commit()
    return get_incident_or_404(incident_id, db)
