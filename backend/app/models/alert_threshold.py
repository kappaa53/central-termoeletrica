# backend/app/models/alert_threshold.py
from sqlalchemy import Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class AlertThreshold(Base):
    """Limites de alarme por parâmetro operacional.

    Um valor abaixo de *_min ou acima de *_max gera um alerta.
    O parâmetro "load_pct" é calculado (potência / potência nominal × 100).
    """

    __tablename__ = "alert_thresholds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    parameter: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="")

    warning_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    critical_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    critical_max: Mapped[float | None] = mapped_column(Float, nullable=True)

    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
