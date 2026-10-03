# backend/app/models/maintenance.py
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

MAINTENANCE_TYPES = ("PREVENTIVA", "CORRETIVA", "PREDITIVA", "URGENTE")
MAINTENANCE_PRIORITIES = ("BAIXA", "MEDIA", "ALTA")
MAINTENANCE_STATUSES = ("AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA")
MAINTENANCE_PENDING_STATUSES = ("AGENDADA", "EM_ANDAMENTO")


class MaintenanceOrder(Base):
    __tablename__ = "maintenance_orders"
    __table_args__ = (
        Index("ix_maintenance_group_status", "group_id", "status"),
        Index("ix_maintenance_scheduled_date", "scheduled_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    incident_id: Mapped[int | None] = mapped_column(
        ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True
    )

    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="MEDIA")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="AGENDADA")

    scheduled_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    technician: Mapped[str] = mapped_column(String(100), nullable=False)
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    actual_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    work_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    group = relationship("Group")
    incident = relationship("Incident", back_populates="maintenance_orders")

    @property
    def group_code(self) -> str | None:
        return self.group.code if self.group else None

    @property
    def overdue(self) -> bool:
        return self.status == "AGENDADA" and self.scheduled_date < datetime.now()
