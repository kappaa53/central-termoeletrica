# backend/app/schemas/maintenance.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

MaintenanceType = Literal["PREVENTIVA", "CORRETIVA", "PREDITIVA", "URGENTE"]
MaintenancePriority = Literal["BAIXA", "MEDIA", "ALTA"]
MaintenanceStatus = Literal["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]


class MaintenanceResponse(BaseModel):
    id: int
    group_id: int
    group_code: Optional[str] = None
    incident_id: Optional[int] = None
    type: MaintenanceType
    title: str
    description: str
    priority: MaintenancePriority
    status: MaintenanceStatus
    scheduled_date: datetime
    started_at: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    technician: str
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    work_hours: Optional[float] = None
    notes: Optional[str] = None
    overdue: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaintenancePage(BaseModel):
    items: list[MaintenanceResponse]
    total: int
    limit: int
    offset: int


class MaintenanceCreate(BaseModel):
    group_code: str
    incident_id: Optional[int] = None
    type: MaintenanceType
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    priority: MaintenancePriority = "MEDIA"
    scheduled_date: datetime
    technician: str = Field(min_length=1, max_length=100)
    estimated_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class MaintenanceEdit(BaseModel):
    type: Optional[MaintenanceType] = None
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    priority: Optional[MaintenancePriority] = None
    scheduled_date: Optional[datetime] = None
    technician: Optional[str] = Field(None, min_length=1, max_length=100)
    estimated_cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class MaintenanceStart(BaseModel):
    # Colocar o grupo em "Manutenção" enquanto a ordem decorre
    set_group_maintenance: bool = True


class MaintenanceComplete(BaseModel):
    actual_cost: Optional[float] = Field(None, ge=0)
    work_hours: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class MaintenanceCancel(BaseModel):
    reason: str = Field(min_length=1)


class MaintenanceSummary(BaseModel):
    scheduled: int
    in_progress: int
    overdue: int
    completed_last_30d: int
    cost_last_30d: float
    estimated_pending_cost: float
