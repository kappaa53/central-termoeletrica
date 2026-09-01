# backend/app/schemas/group.py
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class GroupBase(BaseModel):
    code: str
    manufacturer: str
    engine_model: Optional[str] = None
    cylinders: int
    cylinder_configuration: str
    nominal_power_mw: Decimal
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
    nominal_power_mw: Optional[Decimal] = None
    serial_number: Optional[str] = None
    active: Optional[bool] = None
    status: Optional[str] = None


class GroupResponse(GroupBase):
    id: int

    class Config:
        from_attributes = True