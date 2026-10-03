# backend/app/routers/dashboard.py
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.group import Group as GroupModel
from app.models.operational_reading import OperationalReading as ReadingModel
from app.schemas.dashboard import DashboardGroup, DashboardSummary


router = APIRouter(prefix="/dashboard", tags=["dashboard"])

STATUS_OPERATING = "Em operação"
STATUS_STOPPED = "Parado"
STATUS_MAINTENANCE = "Manutenção"


def pct(part: float, whole: float) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Indicadores gerais da central calculados a partir das últimas leituras"""
    groups = db.scalars(
        select(GroupModel).where(GroupModel.active.is_(True)).order_by(GroupModel.id)
    ).all()

    # Leitura mais recente de cada grupo (DISTINCT ON do PostgreSQL)
    latest_by_group = {
        r.group_id: r
        for r in db.scalars(
            select(ReadingModel)
            .distinct(ReadingModel.group_id)
            .order_by(ReadingModel.group_id, desc(ReadingModel.timestamp))
        ).all()
    }

    last_reading_at = max(
        (r.timestamp for r in latest_by_group.values()), default=None
    )

    # Energia produzida nas 24h anteriores à última leitura (contador acumulado)
    energy_24h = 0.0
    if last_reading_at is not None:
        rows = db.execute(
            select(
                func.max(ReadingModel.energy_produced)
                - func.min(ReadingModel.energy_produced)
            )
            .where(ReadingModel.timestamp >= last_reading_at - timedelta(hours=24))
            .group_by(ReadingModel.group_id)
        ).scalars()
        energy_24h = sum(v or 0.0 for v in rows)

    installed = 0.0
    operating_capacity = 0.0
    current_power = 0.0
    counts = {STATUS_OPERATING: 0, STATUS_STOPPED: 0, STATUS_MAINTENANCE: 0}
    dashboard_groups: list[DashboardGroup] = []

    for g in groups:
        nominal = float(g.nominal_power_mw)
        installed += nominal
        if g.status in counts:
            counts[g.status] += 1

        reading = latest_by_group.get(g.id)
        if g.status == STATUS_OPERATING:
            operating_capacity += nominal
            if reading and reading.power:
                current_power += reading.power

        dashboard_groups.append(
            DashboardGroup(
                id=g.id,
                code=g.code,
                manufacturer=g.manufacturer,
                nominal_power_mw=nominal,
                status=g.status,
                last_reading_at=reading.timestamp if reading else None,
                power_mw=reading.power if reading else None,
                oil_temperature=reading.oil_temperature if reading else None,
                water_temperature=reading.water_temperature if reading else None,
            )
        )

    total = len(groups)

    return DashboardSummary(
        total_groups=total,
        operating_groups=counts[STATUS_OPERATING],
        stopped_groups=counts[STATUS_STOPPED],
        maintenance_groups=counts[STATUS_MAINTENANCE],
        installed_power_mw=round(installed, 3),
        operating_capacity_mw=round(operating_capacity, 3),
        current_power_mw=round(current_power, 3),
        # Disponível = qualquer grupo que não esteja em manutenção
        availability_pct=pct(total - counts[STATUS_MAINTENANCE], total),
        load_factor_pct=pct(current_power, operating_capacity),
        operating_capacity_pct=pct(operating_capacity, installed),
        energy_24h_mwh=round(energy_24h, 3),
        last_reading_at=last_reading_at,
        groups=dashboard_groups,
    )
