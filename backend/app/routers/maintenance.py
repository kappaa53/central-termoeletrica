# backend/app/routers/maintenance.py
from datetime import timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.auth import MANAGEMENT, get_current_user, require_roles
from app.core.database import get_db
from app.models.group import Group
from app.models.incident import Incident, IncidentUpdate
from app.models.maintenance import MAINTENANCE_PENDING_STATUSES, MaintenanceOrder
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCancel,
    MaintenanceComplete,
    MaintenanceCreate,
    MaintenanceEdit,
    MaintenancePage,
    MaintenanceResponse,
    MaintenanceStart,
    MaintenanceSummary,
)
from app.services.alert_engine import now


router = APIRouter(prefix="/maintenance", tags=["maintenance"])

GROUP_MAINTENANCE = "Manutenção"
GROUP_STOPPED = "Parado"


def get_order_or_404(order_id: int, db: Session) -> MaintenanceOrder:
    order = db.get(MaintenanceOrder, order_id, options=[joinedload(MaintenanceOrder.group)])
    if not order:
        raise HTTPException(status_code=404, detail=f"Ordem de manutenção {order_id} não encontrada")
    return order


def log_on_incident(
    order: MaintenanceOrder, author: str, note: str, new_status: str | None = None
) -> None:
    """Regista na cronologia da ocorrência associada (se existir)."""
    incident = order.incident
    if incident is None or incident.status == "FECHADA":
        return
    t = now()
    update = IncidentUpdate(created_at=t, author=author, note=note)
    if new_status and new_status != incident.status:
        update.from_status = incident.status
        update.to_status = new_status
        incident.status = new_status
    incident.updates.append(update)
    incident.updated_at = t


def release_group(order: MaintenanceOrder, db: Session) -> None:
    """Liberta o grupo se não houver outras ordens em curso."""
    group = order.group
    if group.status != GROUP_MAINTENANCE:
        return
    others = db.scalar(
        select(func.count()).where(
            MaintenanceOrder.group_id == group.id,
            MaintenanceOrder.status == "EM_ANDAMENTO",
            MaintenanceOrder.id != order.id,
        )
    )
    if not others:
        group.status = GROUP_STOPPED


@router.get("/", response_model=MaintenancePage)
def list_maintenance(
    group_code: Optional[str] = Query(None),
    status: Optional[Literal["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA", "PENDING"]] = Query(
        None, description="PENDING = AGENDADA + EM_ANDAMENTO"
    ),
    type: Optional[Literal["PREVENTIVA", "CORRETIVA", "PREDITIVA", "URGENTE"]] = Query(None),
    overdue: Optional[bool] = Query(None, description="Só ordens agendadas com data ultrapassada"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Lista ordens de manutenção; pendentes primeiro, por data"""
    filters = []
    if group_code:
        filters.append(Group.code == group_code)
    if status == "PENDING":
        filters.append(MaintenanceOrder.status.in_(MAINTENANCE_PENDING_STATUSES))
    elif status:
        filters.append(MaintenanceOrder.status == status)
    if type:
        filters.append(MaintenanceOrder.type == type)
    if overdue:
        filters.append(MaintenanceOrder.status == "AGENDADA")
        filters.append(MaintenanceOrder.scheduled_date < now())

    base = select(MaintenanceOrder).join(Group).where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0

    status_order = case(
        (MaintenanceOrder.status == "EM_ANDAMENTO", 0),
        (MaintenanceOrder.status == "AGENDADA", 1),
        else_=2,
    )
    # Pendentes: mais próximas primeiro; histórico: mais recentes primeiro
    date_order = case(
        (MaintenanceOrder.status.in_(MAINTENANCE_PENDING_STATUSES), func.extract("epoch", MaintenanceOrder.scheduled_date)),
        else_=-func.extract("epoch", func.coalesce(MaintenanceOrder.completed_date, MaintenanceOrder.updated_at)),
    )
    items = db.scalars(
        base.options(joinedload(MaintenanceOrder.group))
        .order_by(status_order, date_order, MaintenanceOrder.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return MaintenancePage(items=items, total=total, limit=limit, offset=offset)


@router.get("/summary", response_model=MaintenanceSummary)
def maintenance_summary(db: Session = Depends(get_db)):
    """Indicadores da manutenção"""
    t = now()
    since = t - timedelta(days=30)

    def count(*where) -> int:
        return db.scalar(select(func.count()).select_from(MaintenanceOrder).where(*where)) or 0

    completed = db.execute(
        select(func.count(), func.coalesce(func.sum(MaintenanceOrder.actual_cost), 0.0)).where(
            MaintenanceOrder.status == "CONCLUIDA", MaintenanceOrder.completed_date >= since
        )
    ).one()

    pending_cost = db.scalar(
        select(func.coalesce(func.sum(MaintenanceOrder.estimated_cost), 0.0)).where(
            MaintenanceOrder.status.in_(MAINTENANCE_PENDING_STATUSES)
        )
    )

    return MaintenanceSummary(
        scheduled=count(MaintenanceOrder.status == "AGENDADA"),
        in_progress=count(MaintenanceOrder.status == "EM_ANDAMENTO"),
        overdue=count(MaintenanceOrder.status == "AGENDADA", MaintenanceOrder.scheduled_date < t),
        completed_last_30d=completed[0],
        cost_last_30d=round(float(completed[1]), 2),
        estimated_pending_cost=round(float(pending_cost or 0), 2),
    )


@router.get("/{order_id}", response_model=MaintenanceResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return get_order_or_404(order_id, db)


@router.post("/", response_model=MaintenanceResponse, status_code=201)
def create_order(
    body: MaintenanceCreate,
    user: User = Depends(require_roles(*MANAGEMENT)),
    db: Session = Depends(get_db),
):
    """Agenda uma ordem de manutenção"""
    group = db.scalars(select(Group).where(Group.code == body.group_code)).first()
    if not group:
        raise HTTPException(status_code=404, detail=f"Grupo {body.group_code} não encontrado")

    if body.incident_id is not None:
        incident = db.get(Incident, body.incident_id)
        if not incident or incident.group_id != group.id:
            raise HTTPException(status_code=422, detail="A ocorrência indicada não pertence a este grupo")

    t = now()
    data = body.model_dump(exclude={"group_code"})
    data["scheduled_date"] = body.scheduled_date.replace(tzinfo=None)
    order = MaintenanceOrder(group_id=group.id, status="AGENDADA", created_at=t, updated_at=t, **data)
    db.add(order)
    db.flush()
    log_on_incident(order, user.name, f"Ordem de manutenção #{order.id} agendada: {order.title}")
    db.commit()
    return get_order_or_404(order.id, db)


@router.patch(
    "/{order_id}",
    response_model=MaintenanceResponse,
    dependencies=[Depends(require_roles(*MANAGEMENT))],
)
def edit_order(order_id: int, body: MaintenanceEdit, db: Session = Depends(get_db)):
    """Edita uma ordem ainda não concluída/cancelada"""
    order = get_order_or_404(order_id, db)
    if order.status not in MAINTENANCE_PENDING_STATUSES:
        raise HTTPException(status_code=409, detail="Só ordens pendentes podem ser editadas")

    for key, value in body.model_dump(exclude_unset=True).items():
        if key == "scheduled_date" and value is not None:
            value = value.replace(tzinfo=None)
        setattr(order, key, value)
    order.updated_at = now()
    db.commit()
    return get_order_or_404(order_id, db)


@router.post("/{order_id}/start", response_model=MaintenanceResponse)
def start_order(
    order_id: int,
    body: MaintenanceStart,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Inicia a execução da ordem"""
    order = get_order_or_404(order_id, db)
    if order.status != "AGENDADA":
        raise HTTPException(status_code=409, detail="Só ordens agendadas podem ser iniciadas")

    t = now()
    order.status = "EM_ANDAMENTO"
    order.started_at = t
    order.updated_at = t
    if body.set_group_maintenance:
        order.group.status = GROUP_MAINTENANCE

    # Ocorrência associada passa a "em execução"
    incident = order.incident
    new_status = "EM_EXECUCAO" if incident and incident.status in ("ABERTA", "EM_ANALISE") else None
    log_on_incident(order, user.name, f"Ordem de manutenção #{order.id} iniciada", new_status)

    db.commit()
    return get_order_or_404(order_id, db)


@router.post("/{order_id}/complete", response_model=MaintenanceResponse)
def complete_order(
    order_id: int,
    body: MaintenanceComplete,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Conclui a ordem e regista custos/horas"""
    order = get_order_or_404(order_id, db)
    if order.status not in MAINTENANCE_PENDING_STATUSES:
        raise HTTPException(status_code=409, detail="A ordem já está concluída ou cancelada")

    t = now()
    if order.started_at is None:
        order.started_at = t
    order.status = "CONCLUIDA"
    order.completed_date = t
    order.updated_at = t
    if body.actual_cost is not None:
        order.actual_cost = body.actual_cost
    if body.work_hours is not None:
        order.work_hours = body.work_hours
    if body.notes:
        order.notes = f"{order.notes}\n{body.notes}" if order.notes else body.notes

    release_group(order, db)
    log_on_incident(order, user.name, f"Ordem de manutenção #{order.id} concluída")

    db.commit()
    return get_order_or_404(order_id, db)


@router.post("/{order_id}/cancel", response_model=MaintenanceResponse)
def cancel_order(
    order_id: int,
    body: MaintenanceCancel,
    user: User = Depends(require_roles(*MANAGEMENT)),
    db: Session = Depends(get_db),
):
    """Cancela uma ordem pendente"""
    order = get_order_or_404(order_id, db)
    if order.status not in MAINTENANCE_PENDING_STATUSES:
        raise HTTPException(status_code=409, detail="A ordem já está concluída ou cancelada")

    was_running = order.status == "EM_ANDAMENTO"
    t = now()
    order.status = "CANCELADA"
    order.updated_at = t
    reason = f"Cancelada: {body.reason}"
    order.notes = f"{order.notes}\n{reason}" if order.notes else reason

    if was_running:
        release_group(order, db)
    log_on_incident(order, user.name, f"Ordem de manutenção #{order.id} cancelada ({body.reason})")

    db.commit()
    return get_order_or_404(order_id, db)
