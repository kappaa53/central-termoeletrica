# backend/app/models/incident.py
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

INCIDENT_TYPES = ("ELETRICA", "MECANICA", "OPERACIONAL", "SEGURANCA", "OUTROS")
INCIDENT_SEVERITIES = ("BAIXA", "MEDIA", "ALTA", "CRITICA")
INCIDENT_STATUSES = ("ABERTA", "EM_ANALISE", "EM_EXECUCAO", "RESOLVIDA", "FECHADA")
INCIDENT_OPEN_STATUSES = ("ABERTA", "EM_ANALISE", "EM_EXECUCAO")

# Transições de estado permitidas
INCIDENT_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "ABERTA": ("EM_ANALISE", "EM_EXECUCAO", "RESOLVIDA"),
    "EM_ANALISE": ("EM_EXECUCAO", "RESOLVIDA"),
    "EM_EXECUCAO": ("EM_ANALISE", "RESOLVIDA"),
    "RESOLVIDA": ("FECHADA", "ABERTA"),  # ABERTA = reabrir
    "FECHADA": (),
}


class Incident(Base):
    __tablename__ = "incidents"
    __table_args__ = (Index("ix_incidents_group_status", "group_id", "status"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    alert_id: Mapped[int | None] = mapped_column(
        ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ABERTA")

    description: Mapped[str] = mapped_column(Text, nullable=False)
    cause: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution: Mapped[str | None] = mapped_column(Text, nullable=True)
    operator: Mapped[str] = mapped_column(String(100), nullable=False)

    opened_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    group = relationship("Group")
    updates = relationship(
        "IncidentUpdate",
        back_populates="incident",
        order_by="IncidentUpdate.created_at",
        cascade="all, delete-orphan",
    )
    maintenance_orders = relationship("MaintenanceOrder", back_populates="incident")

    @property
    def group_code(self) -> str | None:
        return self.group.code if self.group else None


class IncidentUpdate(Base):
    """Cronologia de uma ocorrência: mudanças de estado e notas."""

    __tablename__ = "incident_updates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(
        ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    author: Mapped[str] = mapped_column(String(100), nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    to_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    incident = relationship("Incident", back_populates="updates")
