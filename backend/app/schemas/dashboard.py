# backend/app/schemas/dashboard.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DashboardGroup(BaseModel):
    id: int
    code: str
    manufacturer: str
    nominal_power_mw: float
    status: str
    last_reading_at: Optional[datetime] = None
    power_mw: Optional[float] = None
    oil_temperature: Optional[float] = None
    water_temperature: Optional[float] = None


class DashboardSummary(BaseModel):
    total_groups: int
    operating_groups: int
    stopped_groups: int
    maintenance_groups: int

    installed_power_mw: float
    operating_capacity_mw: float
    current_power_mw: float

    # Percentagens (0-100)
    availability_pct: float
    load_factor_pct: float
    operating_capacity_pct: float

    energy_24h_mwh: float
    last_reading_at: Optional[datetime] = None

    groups: list[DashboardGroup]
