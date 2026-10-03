# backend/app/models/operational_reading.py
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class OperationalReading(Base):
    __tablename__ = "operational_readings"
    __table_args__ = (
        # Consultas mais comuns: leituras de um grupo ordenadas por data
        Index("ix_operational_readings_group_timestamp", "group_id", "timestamp"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    operator: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    
    # Parâmetros operacionais
    operating_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    power: Mapped[float | None] = mapped_column(Float, nullable=True)
    frequency: Mapped[float | None] = mapped_column(Float, nullable=True)
    voltage: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_r: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_s: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_t: Mapped[float | None] = mapped_column(Float, nullable=True)
    power_factor: Mapped[float | None] = mapped_column(Float, nullable=True)
    reactive_power: Mapped[float | None] = mapped_column(Float, nullable=True)
    energy_produced: Mapped[float | None] = mapped_column(Float, nullable=True)
    exhaust_temp_right: Mapped[float | None] = mapped_column(Float, nullable=True)
    exhaust_temp_left: Mapped[float | None] = mapped_column(Float, nullable=True)
    oil_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    oil_pressure: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    intake_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)

    group = relationship("Group", back_populates="readings")

    @property
    def group_code(self) -> str | None:
        return self.group.code if self.group else None