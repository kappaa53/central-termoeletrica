from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class OperationalReading(Base):
    __tablename__ = "operational_readings"

    __table_args__ = (
        UniqueConstraint(
            "group_id",
            "reading_datetime",
            name="uq_group_reading_datetime",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id"),
        nullable=False,
        index=True,
    )

    reading_datetime: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    operator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    group_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    status_reason: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status_observation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    operating_hours: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    power_mw: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 3),
        nullable=True,
    )

    frequency_hz: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 3),
        nullable=True,
    )

    voltage_v: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    current_r_a: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    current_s_a: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    current_t_a: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    power_factor: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 4),
        nullable=True,
    )

    reactive_power: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )

    energy_produced: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 3),
        nullable=True,
    )

    exhaust_temp_right_c: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    exhaust_temp_left_c: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    oil_temperature_c: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    oil_pressure: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 3),
        nullable=True,
    )

    water_temperature_c: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    intake_temperature_c: Mapped[Decimal | None] = mapped_column(
        Numeric(8, 2),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    group = relationship(
        "Group",
        back_populates="readings",
    )

    operator = relationship(
        "User",
    )