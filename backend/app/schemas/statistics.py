# backend/app/schemas/statistics.py
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class StatisticsOverview(BaseModel):
    days: int
    start: datetime
    end: datetime

    energy_mwh: float
    avg_power_mw: float  # potência média total da central no período
    # Percentagens (0-100), com base no estado registado em cada leitura
    availability_pct: float  # fora de manutenção
    utilization_pct: float  # em operação
    load_factor_pct: float  # potência média / nominal (só em operação)

    alerts_total: int
    alerts_critical: int
    incidents_opened: int
    incidents_resolved: int
    mttr_hours: Optional[float] = None  # tempo médio até resolução

    maintenance_completed: int
    maintenance_cost: float  # MT


class DailyEnergy(BaseModel):
    day: date
    energy_mwh: float


class GroupStatistics(BaseModel):
    code: str
    manufacturer: str
    nominal_power_mw: float
    energy_mwh: float
    availability_pct: float
    utilization_pct: float
    load_factor_pct: Optional[float] = None
    operating_hours: float  # horas de funcionamento acumuladas no período
    alerts: int
    incidents: int
    maintenance_cost: float


class CountByKey(BaseModel):
    key: str
    label: str
    count: int


class StatisticsReport(BaseModel):
    overview: StatisticsOverview
    daily_energy: list[DailyEnergy]
    groups: list[GroupStatistics]
    alerts_by_parameter: list[CountByKey]
    incidents_by_type: list[CountByKey]
