# backend/app/routers/alerts.py
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, desc, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.auth import ROLE_ADMIN, get_current_user, require_roles
from app.core.database import get_db
from app.models.alert import (
    ALERT_ACKNOWLEDGED,
    ALERT_ACTIVE,
    ALERT_RESOLVED,
    OPEN_STATUSES,
    SEVERITY_CRITICAL,
    SEVERITY_WARNING,
    Alert,
)
from app.models.alert_threshold import AlertThreshold
from app.models.group import Group
from app.models.user import User
from app.schemas.alert import (
    AlertPage,
    AlertResponse,
    AlertSummary,
    RebuildResult,
)
from app.services.alert_engine import now, rebuild_alerts


router = APIRouter(prefix="/alerts", tags=["alerts"])


def to_response(alerts: list[Alert], db: Session) -> list[AlertResponse]:
    """Acrescenta o nome legível e a unidade do parâmetro."""
    labels = {t.parameter: t for t in db.scalars(select(AlertThreshold))}
    out = []
    for a in alerts:
        t = labels.get(a.parameter)
        out.append(
            AlertResponse.model_validate(a).model_copy(
                update={
                    "parameter_label": t.label if t else a.parameter,
                    "unit": t.unit if t else "",
                }
            )
        )
    return out


def get_alert_or_404(alert_id: int, db: Session) -> Alert:
    alert = db.get(Alert, alert_id, options=[joinedload(Alert.group)])
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alerta {alert_id} não encontrado")
    return alert


@router.get("/", response_model=AlertPage)
def list_alerts(
    group_code: Optional[str] = Query(None),
    status: Optional[Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "OPEN"]] = Query(
        None, description="OPEN = ACTIVE + ACKNOWLEDGED"
    ),
    severity: Optional[Literal["WARNING", "CRITICAL"]] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Lista alertas (mais recentes primeiro)"""
    filters = []
    if group_code:
        filters.append(Group.code == group_code)
    if status == "OPEN":
        filters.append(Alert.status.in_(OPEN_STATUSES))
    elif status:
        filters.append(Alert.status == status)
    if severity:
        filters.append(Alert.severity == severity)

    base = select(Alert).join(Group).where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0

    # Alertas abertos: críticos primeiro; depois os mais recentes
    order = [desc(Alert.created_at), desc(Alert.id)]
    if status in ("OPEN", "ACTIVE", "ACKNOWLEDGED"):
        order.insert(0, case((Alert.severity == SEVERITY_CRITICAL, 0), else_=1))

    items = db.scalars(
        base.options(joinedload(Alert.group))
        .order_by(*order)
        .limit(limit)
        .offset(offset)
    ).all()

    return AlertPage(items=to_response(list(items), db), total=total, limit=limit, offset=offset)


def sort_codes(codes: set[str]) -> list[str]:
    # GG2 antes de GG10
    return sorted(codes, key=lambda c: (len(c), c))


@router.get("/summary", response_model=AlertSummary)
def alerts_summary(db: Session = Depends(get_db)):
    """Contagem de alertas abertos"""
    rows = db.execute(
        select(Alert.status, Alert.severity, Group.code)
        .join(Group)
        .where(Alert.status.in_(OPEN_STATUSES))
    ).all()

    return AlertSummary(
        open=len(rows),
        active=sum(1 for r in rows if r.status == ALERT_ACTIVE),
        acknowledged=sum(1 for r in rows if r.status == ALERT_ACKNOWLEDGED),
        critical_open=sum(1 for r in rows if r.severity == SEVERITY_CRITICAL),
        warning_open=sum(1 for r in rows if r.severity == SEVERITY_WARNING),
        groups_with_open_alerts=sort_codes({r.code for r in rows}),
        groups_with_critical_alerts=sort_codes(
            {r.code for r in rows if r.severity == SEVERITY_CRITICAL}
        ),
    )


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reconhece um alerta ativo"""
    alert = get_alert_or_404(alert_id, db)
    if alert.status != ALERT_ACTIVE:
        raise HTTPException(status_code=409, detail="Só alertas ativos podem ser reconhecidos")

    alert.status = ALERT_ACKNOWLEDGED
    alert.acknowledged_at = now()
    alert.acknowledged_by = user.name
    alert.updated_at = alert.acknowledged_at
    db.commit()
    db.refresh(alert)
    return to_response([alert], db)[0]


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resolve manualmente um alerta aberto"""
    alert = get_alert_or_404(alert_id, db)
    if alert.status == ALERT_RESOLVED:
        raise HTTPException(status_code=409, detail="O alerta já está resolvido")

    alert.status = ALERT_RESOLVED
    alert.resolved_at = now()
    alert.resolved_by = user.name
    alert.updated_at = alert.resolved_at
    db.commit()
    db.refresh(alert)
    return to_response([alert], db)[0]


@router.post(
    "/rebuild",
    response_model=RebuildResult,
    dependencies=[Depends(require_roles(ROLE_ADMIN))],
)
def rebuild(db: Session = Depends(get_db)):
    """Recalcula todos os alertas a partir do histórico de leituras.

    Atenção: apaga reconhecimentos/resoluções manuais existentes.
    """
    total = rebuild_alerts(db)
    db.commit()
    return RebuildResult(total_alerts=total)
