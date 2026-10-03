# backend/app/schemas/group.py
from typing import Optional

from pydantic import BaseModel, ConfigDict


class GroupBase(BaseModel):
    code: str
    manufacturer: str
    engine_model: Optional[str] = None
    cylinders: int
    cylinder_configuration: str
    nominal_power_mw: float
    serial_number: Optional[str] = None
    active: bool = True
    status: str = "Parado"


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    manufacturer: Optional[str] = None
    engine_model: Optional[str] = None
    cylinders: Optional[int] = None
    cylinder_configuration: Optional[str] = None
    nominal_power_mw: Optional[float] = None
    serial_number: Optional[str] = None
    active: Optional[bool] = None
    status: Optional[str] = None


class GroupResponse(GroupBase):
    id: int

    model_config = ConfigDict(from_attributes=True)