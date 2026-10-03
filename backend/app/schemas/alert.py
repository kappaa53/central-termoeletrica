# backend/app/schemas/alert.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    id: int
    group_id: int
    group_code: Optional[str] = None
    reading_id: Optional[int] = None
    parameter: str
    parameter_label: Optional[str] = None
    unit: Optional[str] = None
    severity: Literal["WARNING", "CRITICAL"]
    message: str
    value: float
    threshold: float
    status: Literal["ACTIVE", "ACKNOWLEDGED", "RESOLVED"]
    created_at: datetime
    updated_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertPage(BaseModel):
    items: list[AlertResponse]
    total: int
    limit: int
    offset: int


class AlertSummary(BaseModel):
    open: int
    active: int
    acknowledged: int
    critical_open: int
    warning_open: int
    groups_with_open_alerts: list[str]
    groups_with_critical_alerts: list[str]


class RebuildResult(BaseModel):
    total_alerts: int


class ThresholdResponse(BaseModel):
    id: int
    parameter: str
    label: str
    unit: str
    warning_min: Optional[float] = None
    warning_max: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    active: bool

    model_config = ConfigDict(from_attributes=True)


class ThresholdUpdate(BaseModel):
    warning_min: Optional[float] = None
    warning_max: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    active: bool = True
