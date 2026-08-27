from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    code: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
        index=True,
    )

    manufacturer: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    engine_model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    cylinders: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    cylinder_configuration: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    nominal_power_mw: Mapped[Decimal] = mapped_column(
        Numeric(10, 3),
        nullable=False,
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Parado",
        nullable=False,
    )

    readings = relationship(
        "OperationalReading",
        back_populates="group",
    )