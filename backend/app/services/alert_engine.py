# backend/app/services/alert_engine.py
"""Motor de alertas: compara leituras com os limites configurados.

Regras:
- Só são avaliadas leituras de grupos "Em operação" (um grupo parado tem
  pressão de óleo 0, frequência 0, etc. - isso não é uma anomalia).
- Existe no máximo um alerta aberto (ACTIVE/ACKNOWLEDGED) por grupo e parâmetro.
- Se o valor piorar de aviso para crítico, o alerta é escalado e volta a ACTIVE.
- Quando o valor regressa ao normal, o alerta aberto é resolvido automaticamente.
"""
from dataclasses import dataclass, field
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import (
    ALERT_ACTIVE,
    ALERT_RESOLVED,
    OPEN_STATUSES,
    SEVERITY_CRITICAL,
    SEVERITY_WARNING,
    Alert,
)
from app.models.alert_threshold import AlertThreshold
from app.models.group import Group
from app.models.operational_reading import OperationalReading

STATUS_OPERATING = "Em operação"
AUTO_RESOLVER = "Sistema"

SEVERITY_RANK = {SEVERITY_WARNING: 1, SEVERITY_CRITICAL: 2}


@dataclass
class Violation:
    severity: str
    limit: float
    above: bool


@dataclass
class EvaluationResult:
    created: list[Alert] = field(default_factory=list)
    escalated: list[Alert] = field(default_factory=list)
    resolved: list[Alert] = field(default_factory=list)


def load_thresholds(db: Session) -> list[AlertThreshold]:
    return list(db.scalars(select(AlertThreshold).where(AlertThreshold.active.is_(True))))


def reading_values(reading: OperationalReading, group: Group) -> dict[str, float]:
    """Valores avaliáveis de uma leitura, incluindo parâmetros calculados."""
    values: dict[str, float] = {}
    for column in OperationalReading.__table__.columns.keys():
        value = getattr(reading, column)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            values[column] = float(value)

    nominal = float(group.nominal_power_mw)
    if reading.power is not None and nominal > 0:
        values["load_pct"] = reading.power / nominal * 100
    return values


def classify(value: float, t: AlertThreshold) -> Violation | None:
    """Devolve a violação mais grave do valor face aos limites, ou None."""
    if t.critical_max is not None and value > t.critical_max:
        return Violation(SEVERITY_CRITICAL, t.critical_max, above=True)
    if t.critical_min is not None and value < t.critical_min:
        return Violation(SEVERITY_CRITICAL, t.critical_min, above=False)
    if t.warning_max is not None and value > t.warning_max:
        return Violation(SEVERITY_WARNING, t.warning_max, above=True)
    if t.warning_min is not None and value < t.warning_min:
        return Violation(SEVERITY_WARNING, t.warning_min, above=False)
    return None


def build_message(t: AlertThreshold, v: Violation) -> str:
    direction = "acima" if v.above else "abaixo"
    level = "crítico" if v.severity == SEVERITY_CRITICAL else "de aviso"
    unit = f" {t.unit}" if t.unit else ""
    limit = f"{v.limit:g}".replace(".", ",")
    return f"{t.label} {direction} do limite {level} ({limit}{unit})"


def open_alerts_by_parameter(db: Session, group_id: int) -> dict[str, Alert]:
    alerts = db.scalars(
        select(Alert).where(Alert.group_id == group_id, Alert.status.in_(OPEN_STATUSES))
    )
    return {a.parameter: a for a in alerts}


def evaluate_reading(
    db: Session,
    reading: OperationalReading,
    thresholds: list[AlertThreshold] | None = None,
) -> EvaluationResult:
    """Avalia uma leitura e cria/escala/resolve alertas. Não faz commit."""
    result = EvaluationResult()
    if reading.status != STATUS_OPERATING:
        return result

    group = reading.group or db.get(Group, reading.group_id)
    if thresholds is None:
        thresholds = load_thresholds(db)

    values = reading_values(reading, group)
    open_alerts = open_alerts_by_parameter(db, group.id)
    when = reading.timestamp

    for t in thresholds:
        value = values.get(t.parameter)
        if value is None:
            continue

        violation = classify(value, t)
        current = open_alerts.get(t.parameter)

        if violation is None:
            if current is not None:
                current.status = ALERT_RESOLVED
                current.resolved_at = when
                current.resolved_by = AUTO_RESOLVER
                current.updated_at = when
                result.resolved.append(current)
            continue

        if current is None:
            alert = Alert(
                group_id=group.id,
                reading_id=reading.id,
                parameter=t.parameter,
                severity=violation.severity,
                message=build_message(t, violation),
                value=round(value, 3),
                threshold=violation.limit,
                status=ALERT_ACTIVE,
                created_at=when,
                updated_at=when,
            )
            db.add(alert)
            result.created.append(alert)
            continue

        # Alerta já aberto: atualizar valor e escalar se necessário
        current.value = round(value, 3)
        current.reading_id = reading.id
        current.updated_at = when
        if SEVERITY_RANK[violation.severity] > SEVERITY_RANK[current.severity]:
            current.severity = violation.severity
            current.threshold = violation.limit
            current.message = build_message(t, violation)
            current.status = ALERT_ACTIVE  # escalado: precisa de nova atenção
            result.escalated.append(current)

    db.flush()
    return result


def is_latest_reading(db: Session, reading: OperationalReading) -> bool:
    newer = db.scalar(
        select(OperationalReading.id).where(
            OperationalReading.group_id == reading.group_id,
            OperationalReading.timestamp > reading.timestamp,
        ).limit(1)
    )
    return newer is None


def rebuild_alerts(db: Session) -> int:
    """Apaga os alertas e reavalia todas as leituras por ordem cronológica.

    Útil depois de alterar limites ou de importar dados históricos. Não faz commit.
    """
    db.query(Alert).delete()
    thresholds = load_thresholds(db)
    readings = db.scalars(
        select(OperationalReading).order_by(
            OperationalReading.timestamp, OperationalReading.id
        )
    )
    for reading in readings:
        evaluate_reading(db, reading, thresholds)
    return db.query(Alert).count()


def now() -> datetime:
    # As leituras usam hora local sem fuso; manter coerência
    return datetime.now().replace(microsecond=0)
