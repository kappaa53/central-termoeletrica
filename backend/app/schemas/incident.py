# backend/app/schemas/incident.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

IncidentType = Literal["ELETRICA", "MECANICA", "OPERACIONAL", "SEGURANCA", "OUTROS"]
IncidentSeverity = Literal["BAIXA", "MEDIA", "ALTA", "CRITICA"]
IncidentStatus = Literal["ABERTA", "EM_ANALISE", "EM_EXECUCAO", "RESOLVIDA", "FECHADA"]


class IncidentUpdateResponse(BaseModel):
    id: int
    created_at: datetime
    author: str
    from_status: Optional[IncidentStatus] = None
    to_status: Optional[IncidentStatus] = None
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(BaseModel):
    id: int
    group_id: int
    group_code: Optional[str] = None
    alert_id: Optional[int] = None
    title: str
    type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus
    description: str
    cause: Optional[str] = None
    solution: Optional[str] = None
    operator: str
    opened_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaintenanceRef(BaseModel):
    id: int
    title: str
    status: str
    scheduled_date: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentDetail(IncidentResponse):
    updates: list[IncidentUpdateResponse] = []
    maintenance_orders: list[MaintenanceRef] = []


class IncidentPage(BaseModel):
    items: list[IncidentResponse]
    total: int
    limit: int
    offset: int


class IncidentCreate(BaseModel):
    group_code: str
    alert_id: Optional[int] = None
    title: str = Field(min_length=3, max_length=200)
    type: IncidentType
    severity: IncidentSeverity
    description: str = Field(min_length=1)


class IncidentEdit(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    description: Optional[str] = Field(None, min_length=1)
    cause: Optional[str] = None
    solution: Optional[str] = None


class IncidentStatusChange(BaseModel):
    status: IncidentStatus
    note: Optional[str] = None
    # Permite preencher causa/solução no mesmo passo (ex.: ao resolver)
    cause: Optional[str] = None
    solution: Optional[str] = None


class IncidentNote(BaseModel):
    note: str = Field(min_length=1)


class IncidentSummary(BaseModel):
    open: int
    critical_open: int
    by_status: dict[str, int]
    resolved_last_30d: int
    avg_resolution_hours: Optional[float] = None
