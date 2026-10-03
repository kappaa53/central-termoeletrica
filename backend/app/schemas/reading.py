# backend/app/schemas/reading.py
from datetime import datetime
from typing import Optional

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


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
    group_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReadingPage(BaseModel):
    items: list[OperationalReadingResponse]
    total: int
    limit: int
    offset: int

class OperationalReadingCreate(BaseModel):
    """Registo manual de uma leitura (formulário "Nova leitura")"""

    group_code: str
    timestamp: Optional[datetime] = None  # por omissão: agora
    operator: str = Field(min_length=1, max_length=100)
    status: Literal["Em operação", "Parado", "Manutenção"]
    operating_hours: Optional[float] = Field(None, ge=0)
    power: Optional[float] = Field(None, ge=0, le=10)
    frequency: Optional[float] = Field(None, ge=0, le=70)
    voltage: Optional[float] = Field(None, ge=0, le=1000)
    current_r: Optional[float] = Field(None, ge=0)
    current_s: Optional[float] = Field(None, ge=0)
    current_t: Optional[float] = Field(None, ge=0)
    power_factor: Optional[float] = Field(None, ge=0, le=1)
    reactive_power: Optional[float] = None
    energy_produced: Optional[float] = Field(None, ge=0)
    exhaust_temp_right: Optional[float] = Field(None, ge=-50, le=1000)
    exhaust_temp_left: Optional[float] = Field(None, ge=-50, le=1000)
    oil_temperature: Optional[float] = Field(None, ge=-50, le=200)
    oil_pressure: Optional[float] = Field(None, ge=0, le=20)
    water_temperature: Optional[float] = Field(None, ge=-50, le=200)
    intake_temperature: Optional[float] = Field(None, ge=-50, le=200)


class ReadingCreateResult(BaseModel):
    reading: OperationalReadingResponse
    evaluated: bool  # False se já existir uma leitura mais recente do grupo
    alerts_created: int
    alerts_escalated: int
    alerts_resolved: int
