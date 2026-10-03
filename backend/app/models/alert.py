# backend/app/models/alert.py
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

SEVERITY_WARNING = "WARNING"
SEVERITY_CRITICAL = "CRITICAL"

ALERT_ACTIVE = "ACTIVE"
ALERT_ACKNOWLEDGED = "ACKNOWLEDGED"
ALERT_RESOLVED = "RESOLVED"
OPEN_STATUSES = (ALERT_ACTIVE, ALERT_ACKNOWLEDGED)


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_group_parameter_status", "group_id", "parameter", "status"),
        Index("ix_alerts_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"), nullable=False)
    reading_id: Mapped[int | None] = mapped_column(
        ForeignKey("operational_readings.id", ondelete="SET NULL"), nullable=True
    )

    parameter: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ALERT_ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    group = relationship("Group")

    @property
    def group_code(self) -> str | None:
        return self.group.code if self.group else None
