from datetime import datetime, timedelta
from random import Random

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.group import Group
from app.models.operational_reading import OperationalReading


# ============================================================
# CONFIGURAÇÃO
# ============================================================

DAYS = 30
READINGS_PER_DAY = 8

# Horários aproximados das leituras
READING_HOURS = [
    0,
    3,
    6,
    9,
    12,
    15,
    18,
    21,
]

random = Random(42)


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================

def variation(value: float, percentage: float = 0.05) -> float:
    """Aplica uma pequena variação aleatória."""
    factor = 1 + random.uniform(-percentage, percentage)
    return value * factor


def generate_reading(
    group: Group,
    timestamp: datetime,
    operating_hours: float,
    energy_produced: float,
) -> OperationalReading:

    # --------------------------------------------------------
    # GRUPO PARADO
    # --------------------------------------------------------
    if group.status == "Parado":
        return OperationalReading(
            group_id=group.id,
            timestamp=timestamp,
            operator="Sistema",
            status="Parado",
            operating_hours=operating_hours,
            power=0.0,
            frequency=0.0,
            voltage=0.0,
            current_r=0.0,
            current_s=0.0,
            current_t=0.0,
            power_factor=0.0,
            reactive_power=0.0,
            energy_produced=energy_produced,
            exhaust_temp_right=25.0,
            exhaust_temp_left=25.0,
            oil_temperature=25.0,
            oil_pressure=0.0,
            water_temperature=25.0,
            intake_temperature=25.0,
        )

    # --------------------------------------------------------
    # GRUPO EM MANUTENÇÃO
    # --------------------------------------------------------
    if group.status == "Manutenção":
        return OperationalReading(
            group_id=group.id,
            timestamp=timestamp,
            operator="Sistema",
            status="Manutenção",
            operating_hours=operating_hours,
            power=0.0,
            frequency=0.0,
            voltage=0.0,
            current_r=0.0,
            current_s=0.0,
            current_t=0.0,
            power_factor=0.0,
            reactive_power=0.0,
            energy_produced=energy_produced,
            exhaust_temp_right=25.0,
            exhaust_temp_left=25.0,
            oil_temperature=30.0,
            oil_pressure=0.0,
            water_temperature=30.0,
            intake_temperature=25.0,
        )

    # --------------------------------------------------------
    # GRUPO EM OPERAÇÃO
    # --------------------------------------------------------

    nominal_power = float(group.nominal_power_mw)

    # Operação normalmente entre 70% e 95% da potência nominal
    load_factor = random.uniform(0.72, 0.95)
    power = nominal_power * load_factor

    frequency = variation(50.0, 0.004)
    voltage = variation(400.0, 0.015)

    power_factor = random.uniform(0.91, 0.98)

    # Estimativa simplificada de corrente trifásica.
    # P(kW) = sqrt(3) * V * I * FP / 1000
    current = (
        power
        * 1000
        / (3**0.5 * voltage * power_factor)
    )

    current_r = variation(current, 0.02)
    current_s = variation(current, 0.02)
    current_t = variation(current, 0.02)

    reactive_power = power * (
        ((1 / power_factor**2) - 1) ** 0.5
    )

    exhaust_temp_right = random.uniform(420.0, 520.0)
    exhaust_temp_left = variation(exhaust_temp_right, 0.04)

    oil_temperature = random.uniform(75.0, 88.0)
    oil_pressure = random.uniform(4.0, 5.8)
    water_temperature = random.uniform(78.0, 92.0)
    intake_temperature = random.uniform(25.0, 38.0)

    # Energia produzida em MWh desde a leitura anterior.
    # Cada intervalo possui aproximadamente 3 horas.
    energy_increment = power * 3.0
    energy_produced += energy_increment

    return OperationalReading(
        group_id=group.id,
        timestamp=timestamp,
        operator="Operador",
        status="Em operação",
        operating_hours=operating_hours + 3.0,
        power=round(power, 3),
        frequency=round(frequency, 3),
        voltage=round(voltage, 2),
        current_r=round(current_r, 2),
        current_s=round(current_s, 2),
        current_t=round(current_t, 2),
        power_factor=round(power_factor, 3),
        reactive_power=round(reactive_power, 3),
        energy_produced=round(energy_produced, 3),
        exhaust_temp_right=round(exhaust_temp_right, 2),
        exhaust_temp_left=round(exhaust_temp_left, 2),
        oil_temperature=round(oil_temperature, 2),
        oil_pressure=round(oil_pressure, 2),
        water_temperature=round(water_temperature, 2),
        intake_temperature=round(intake_temperature, 2),
    )


# ============================================================
# SEED
# ============================================================

def seed_readings():
    db = SessionLocal()

    try:
        groups = db.scalars(
            select(Group).order_by(Group.code)
        ).all()

        if not groups:
            print("ERRO: nenhum grupo encontrado no banco.")
            print("Execute primeiro o seed dos grupos.")
            return

        print(f"Grupos encontrados: {len(groups)}")
        print()

        # Evita duplicar leituras caso o script seja executado novamente.
        existing_count = db.query(OperationalReading).count()

        if existing_count > 0:
            print(
                f"ATENÇÃO: já existem {existing_count} leituras."
            )

            response = input(
                "Deseja apagar as leituras existentes? [s/N]: "
            ).strip().lower()

            if response != "s":
                print("Operação cancelada.")
                return

            db.query(OperationalReading).delete()
            db.commit()

            print("Leituras existentes removidas.")
            print()

        today = datetime.now().replace(
            minute=0,
            second=0,
            microsecond=0,
        )

        total_inserted = 0

        for group in groups:
            print(
                f"Gerando leituras para {group.code} "
                f"({group.manufacturer})..."
            )

            operating_hours = random.uniform(1000.0, 5000.0)
            energy_produced = random.uniform(10000.0, 50000.0)

            group_readings = []

            for day in range(DAYS):
                date = today - timedelta(days=DAYS - 1 - day)

                for hour in READING_HOURS:
                    timestamp = date.replace(
                        hour=hour,
                        minute=0,
                        second=0,
                        microsecond=0,
                    )

                    reading = generate_reading(
                        group=group,
                        timestamp=timestamp,
                        operating_hours=operating_hours,
                        energy_produced=energy_produced,
                    )

                    group_readings.append(reading)

                    # Atualiza os acumuladores apenas para grupos em operação
                    if group.status == "Em operação":
                        operating_hours = (
                            reading.operating_hours
                            or operating_hours
                        )
                        energy_produced = (
                            reading.energy_produced
                            or energy_produced
                        )

            db.add_all(group_readings)
            db.flush()

            total_inserted += len(group_readings)

            print(
                f"  -> {len(group_readings)} leituras criadas"
            )

        db.commit()

        print()
        print("=" * 60)
        print("SEED CONCLUÍDO COM SUCESSO")
        print("=" * 60)
        print(f"Grupos:             {len(groups)}")
        print(f"Dias:               {DAYS}")
        print(f"Leituras por dia:   {READINGS_PER_DAY}")
        print(f"Total de leituras:  {total_inserted}")
        print("=" * 60)

    except Exception as exc:
        db.rollback()
        print()
        print("ERRO AO INSERIR LEITURAS:")
        print(exc)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_readings()
