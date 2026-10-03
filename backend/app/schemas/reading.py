# backend/app/schemas/reading.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OperationalReadingBase(BaseModel):
    group_id: int
    timestamp: datetime
    operator: str
    status: str
    operating_hours: Optional[float] = None
    power: Optional[float] = None
    frequency: Optional[float] = None
    voltage: Optional[float] = None
    current_r: Optional[float] = None
    current_s: Optional[float] = None
    current_t: Optional[float] = None
    power_factor: Optional[float] = None
    reactive_power: Optional[float] = None
    energy_produced: Optional[float] = None
    exhaust_temp_right: Optional[float] = None
    exhaust_temp_left: Optional[float] = None
    oil_temperature: Optional[float] = None
    oil_pressure: Optional[float] = None
    water_temperature: Optional[float] = None
    intake_temperature: Optional[float] = None


class OperationalReadingResponse(OperationalReadingBase):
    id: int

    model_config = ConfigDict(from_attributes=True)