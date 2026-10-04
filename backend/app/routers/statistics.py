# backend/app/routers/statistics.py
"""Indicadores históricos da central.

Energia: soma dos incrementos do contador `energy_produced` entre leituras
consecutivas de cada grupo (ignorando reinícios/valores negativos).
Disponibilidade/utilização: proporção de leituras fora de manutenção /
em operação no período.
"""
from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.alert import SEVERITY_CRITICAL, Alert
from app.models.alert_threshold import AlertThreshold
from app.models.group import Group
from app.models.incident import Incident
from app.models.maintenance import MaintenanceOrder
from app.models.operational_reading import OperationalReading as Reading
from app.schemas.statistics import (
    CountByKey,
    DailyEnergy,
    GroupStatistics,
    StatisticsOverview,
    StatisticsReport,
)
from app.services.alert_engine import now


router = APIRouter(prefix="/statistics", tags=["statistics"])

STATUS_OPERATING = "Em operação"
STATUS_MAINTENANCE = "Manutenção"

INCIDENT_TYPE_LABELS = {
    "ELETRICA": "Elétrica",
    "MECANICA": "Mecânica",
    "OPERACIONAL": "Operacional",
    "SEGURANCA": "Segurança",
    "OUTROS": "Outros",
}


def pct(part: float, whole: float) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


@router.get("/", response_model=StatisticsReport)
def get_statistics(
    days: int = Query(30, ge=1, le=365, description="Período em dias até agora"),
    db: Session = Depends(get_db),
):
    end = now()
    start = end - timedelta(days=days)
    in_period = and_(Reading.timestamp >= start, Reading.timestamp <= end)

    groups = db.scalars(select(Group).where(Group.active.is_(True)).order_by(Group.id)).all()
    nominal = {g.id: float(g.nominal_power_mw) for g in groups}

    # ------------------------------------------------ energia (incrementos do contador)
    # Inclui a última leitura antes do período como referência do contador
    prev = func.lag(Reading.energy_produced).over(partition_by=Reading.group_id, order_by=Reading.timestamp)
    prev_hours = func.lag(Reading.operating_hours).over(partition_by=Reading.group_id, order_by=Reading.timestamp)
    deltas = (
        select(
            Reading.group_id,
            Reading.timestamp,
            (Reading.energy_produced - prev).label("energy_delta"),
            (Reading.operating_hours - prev_hours).label("hours_delta"),
        )
        .where(Reading.timestamp >= start - timedelta(days=1), Reading.timestamp <= end)
        .subquery()
    )
    positive = lambda col: case((col > 0, col), else_=0.0)  # noqa: E731

    day = func.date(deltas.c.timestamp)
    daily_rows = db.execute(
        select(day.label("day"), func.sum(positive(deltas.c.energy_delta)))
        .where(deltas.c.timestamp >= start)
        .group_by(day)
        .order_by(day)
    ).all()
    daily_energy = [DailyEnergy(day=d, energy_mwh=round(float(e or 0), 2)) for d, e in daily_rows]

    per_group_counters = {
        gid: (float(e or 0), float(h or 0))
        for gid, e, h in db.execute(
            select(
                deltas.c.group_id,
                func.sum(positive(deltas.c.energy_delta)),
                func.sum(positive(deltas.c.hours_delta)),
            )
            .where(deltas.c.timestamp >= start)
            .group_by(deltas.c.group_id)
        ).all()
    }

    # ------------------------------------------------ estados e carga por grupo
    status_rows = db.execute(
        select(
            Reading.group_id,
            func.count(),
            func.count().filter(Reading.status == STATUS_OPERATING),
            func.count().filter(Reading.status == STATUS_MAINTENANCE),
            func.avg(Reading.power).filter(Reading.status == STATUS_OPERATING),
        )
        .where(in_period)
        .group_by(Reading.group_id)
    ).all()
    status_by_group = {gid: (total, op, mnt, avg_p) for gid, total, op, mnt, avg_p in status_rows}

    # ------------------------------------------------ alertas / ocorrências / manutenção
    alerts_by_group = dict(
        db.execute(
            select(Alert.group_id, func.count())
            .where(Alert.created_at >= start, Alert.created_at <= end)
            .group_by(Alert.group_id)
        ).all()
    )
    alerts_critical = db.scalar(
        select(func.count()).where(
            Alert.created_at >= start, Alert.created_at <= end, Alert.severity == SEVERITY_CRITICAL
        )
    ) or 0

    incidents_by_group = dict(
        db.execute(
            select(Incident.group_id, func.count())
            .where(Incident.opened_at >= start, Incident.opened_at <= end)
            .group_by(Incident.group_id)
        ).all()
    )
    resolved = db.execute(
        select(Incident.opened_at, Incident.resolved_at).where(
            Incident.resolved_at.is_not(None), Incident.resolved_at >= start, Incident.resolved_at <= end
        )
    ).all()
    mttr = (
        round(sum((r.resolved_at - r.opened_at).total_seconds() for r in resolved) / len(resolved) / 3600, 1)
        if resolved
        else None
    )

    maintenance_rows = db.execute(
        select(MaintenanceOrder.group_id, func.count(), func.coalesce(func.sum(MaintenanceOrder.actual_cost), 0.0))
        .where(
            MaintenanceOrder.status == "CONCLUIDA",
            MaintenanceOrder.completed_date >= start,
            MaintenanceOrder.completed_date <= end,
        )
        .group_by(MaintenanceOrder.group_id)
    ).all()
    maintenance_by_group = {gid: (count, float(cost)) for gid, count, cost in maintenance_rows}

    # ------------------------------------------------ por grupo
    group_stats: list[GroupStatistics] = []
    totals = defaultdict(float)
    for g in groups:
        total, op, mnt, avg_p = status_by_group.get(g.id, (0, 0, 0, None))
        energy, hours = per_group_counters.get(g.id, (0.0, 0.0))
        load = pct(float(avg_p), nominal[g.id]) if avg_p is not None else None

        totals["readings"] += total
        totals["operating"] += op
        totals["maintenance"] += mnt
        if avg_p is not None:
            totals["power_x_readings"] += float(avg_p) * op
            totals["nominal_x_readings"] += nominal[g.id] * op

        group_stats.append(
            GroupStatistics(
                code=g.code,
                manufacturer=g.manufacturer,
                nominal_power_mw=nominal[g.id],
                energy_mwh=round(energy, 2),
                availability_pct=pct(total - mnt, total),
                utilization_pct=pct(op, total),
                load_factor_pct=load,
                operating_hours=round(hours, 1),
                alerts=alerts_by_group.get(g.id, 0),
                incidents=incidents_by_group.get(g.id, 0),
                maintenance_cost=round(maintenance_by_group.get(g.id, (0, 0.0))[1], 2),
            )
        )

    energy_total = sum(g.energy_mwh for g in group_stats)
    period_hours = (end - start).total_seconds() / 3600

    overview = StatisticsOverview(
        days=days,
        start=start,
        end=end,
        energy_mwh=round(energy_total, 2),
        avg_power_mw=round(energy_total / period_hours, 3) if period_hours else 0.0,
        availability_pct=pct(totals["readings"] - totals["maintenance"], totals["readings"]),
        utilization_pct=pct(totals["operating"], totals["readings"]),
        load_factor_pct=pct(totals["power_x_readings"], totals["nominal_x_readings"]),
        alerts_total=sum(alerts_by_group.values()),
        alerts_critical=alerts_critical,
        incidents_opened=sum(incidents_by_group.values()),
        incidents_resolved=len(resolved),
        mttr_hours=mttr,
        maintenance_completed=sum(c for c, _ in maintenance_by_group.values()),
        maintenance_cost=round(sum(cost for _, cost in maintenance_by_group.values()), 2),
    )

    # ------------------------------------------------ distribuições
    labels = {t.parameter: t.label for t in db.scalars(select(AlertThreshold))}
    alerts_by_parameter = [
        CountByKey(key=param, label=labels.get(param, param), count=count)
        for param, count in db.execute(
            select(Alert.parameter, func.count())
            .where(Alert.created_at >= start, Alert.created_at <= end)
            .group_by(Alert.parameter)
            .order_by(func.count().desc())
        ).all()
    ]
    incidents_by_type = [
        CountByKey(key=t, label=INCIDENT_TYPE_LABELS.get(t, t), count=count)
        for t, count in db.execute(
            select(Incident.type, func.count())
            .where(Incident.opened_at >= start, Incident.opened_at <= end)
            .group_by(Incident.type)
            .order_by(func.count().desc())
        ).all()
    ]

    return StatisticsReport(
        overview=overview,
        daily_energy=daily_energy,
        groups=group_stats,
        alerts_by_parameter=alerts_by_parameter,
        incidents_by_type=incidents_by_type,
    )
