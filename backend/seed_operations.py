"""Seed de ocorrências e ordens de manutenção.

Coerente com o estado dos grupos (seed_data.py) e com os alertas gerados
por seed_readings.py. Executar depois desses dois scripts.
Substitui todas as ocorrências e ordens de manutenção existentes.
"""
from datetime import datetime, timedelta

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.alert import Alert
from app.models.group import Group
from app.models.incident import Incident, IncidentUpdate
from app.models.maintenance import MaintenanceOrder


def ago(**kwargs) -> datetime:
    return (datetime.now() - timedelta(**kwargs)).replace(minute=0, second=0, microsecond=0)


def ahead(**kwargs) -> datetime:
    return (datetime.now() + timedelta(**kwargs)).replace(minute=0, second=0, microsecond=0)


def make_incident(groups, code, *, title, type, severity, status, description, operator,
                  opened, history, cause=None, solution=None, alert=None):
    """history: lista de (quando, autor, de, para, nota)"""
    last = history[-1][0] if history else opened
    inc = Incident(
        group_id=groups[code].id,
        alert_id=alert.id if alert else None,
        title=title, type=type, severity=severity, status=status,
        description=description, cause=cause, solution=solution, operator=operator,
        opened_at=opened, created_at=opened, updated_at=last,
        resolved_at=next((w for w, _, _, to, _ in history if to == "RESOLVIDA"), None),
        closed_at=next((w for w, _, _, to, _ in history if to == "FECHADA"), None),
    )
    inc.updates.append(
        IncidentUpdate(created_at=opened, author=operator, to_status="ABERTA", note="Ocorrência aberta")
    )
    for when, author, frm, to, note in history:
        inc.updates.append(
            IncidentUpdate(created_at=when, author=author, from_status=frm, to_status=to, note=note)
        )
    return inc


def make_order(groups, code, *, title, type, priority, status, scheduled, technician,
               description="", estimated=None, actual=None, hours=None, notes=None,
               started=None, completed=None, incident=None):
    created = min(scheduled, ago(days=1)) - timedelta(days=2)
    return MaintenanceOrder(
        group_id=groups[code].id,
        incident=incident,
        title=title, type=type, priority=priority, status=status,
        description=description, scheduled_date=scheduled, technician=technician,
        estimated_cost=estimated, actual_cost=actual, work_hours=hours, notes=notes,
        started_at=started, completed_date=completed,
        created_at=created, updated_at=completed or started or created,
    )


def seed_operations():
    db = SessionLocal()
    try:
        groups = {g.code: g for g in db.scalars(select(Group))}
        if not groups:
            print("ERRO: execute primeiro seed_data.py e seed_readings.py")
            return

        def latest_alert(code, parameter):
            return db.scalars(
                select(Alert)
                .join(Group)
                .where(Group.code == code, Alert.parameter == parameter)
                .order_by(Alert.created_at.desc())
            ).first()

        db.query(MaintenanceOrder).delete()
        db.query(Incident).delete()
        db.flush()

        # ------------------------------------------------------------ OCORRÊNCIAS
        inc_gg2 = make_incident(
            groups, "GG2",
            title="Sobreaquecimento do óleo do motor",
            type="MECANICA", severity="ALTA", status="EM_ANALISE",
            description="Temperatura do óleo a subir nas últimas leituras até ultrapassar 95 °C.",
            operator="Ana Júlia", opened=ago(hours=5), alert=latest_alert("GG2", "oil_temperature"),
            history=[(ago(hours=4), "Carlos Manuel", "ABERTA", "EM_ANALISE",
                      "Verificar radiador e válvula termostática do circuito de óleo.")],
        )
        inc_gg7 = make_incident(
            groups, "GG7",
            title="Pressão do óleo abaixo do normal",
            type="MECANICA", severity="MEDIA", status="ABERTA",
            description="Pressão do óleo a 3,1 bar. Verificar nível de óleo e filtro.",
            operator="Nelson Cadete", opened=ago(hours=3), alert=latest_alert("GG7", "oil_pressure"),
            history=[],
        )
        inc_gg4 = make_incident(
            groups, "GG4",
            title="Falha no sistema de arranque",
            type="ELETRICA", severity="ALTA", status="EM_EXECUCAO",
            description="O grupo não arranca. Motor de arranque não responde ao comando.",
            cause="Motor de arranque com enrolamento queimado.",
            operator="Ana Júlia", opened=ago(days=6),
            history=[
                (ago(days=6) + timedelta(hours=2), "Carlos Manuel", "ABERTA", "EM_ANALISE", "Diagnóstico em curso."),
                (ago(days=5), "Carlos Manuel", "EM_ANALISE", "EM_EXECUCAO", "Peça encomendada ao fornecedor."),
            ],
        )
        inc_gg1 = make_incident(
            groups, "GG1",
            title="Pico de temperatura da água de arrefecimento",
            type="MECANICA", severity="ALTA", status="RESOLVIDA",
            description="Temperatura da água atingiu 99 °C.",
            cause="Termóstato preso na posição fechada.",
            solution="Substituição do termóstato e purga do circuito.",
            operator="Nelson Cadete", opened=ago(hours=17), alert=latest_alert("GG1", "water_temperature"),
            history=[
                (ago(hours=16), "Carlos Manuel", "ABERTA", "EM_EXECUCAO", "Intervenção imediata."),
                (ago(hours=10), "Carlos Manuel", "EM_EXECUCAO", "RESOLVIDA", "Valores normalizados."),
            ],
        )
        inc_gg5 = make_incident(
            groups, "GG5",
            title="Temperatura de escape elevada (lado esquerdo)",
            type="MECANICA", severity="MEDIA", status="FECHADA",
            description="Escape esquerdo a 572 °C numa leitura isolada.",
            cause="Leitura pontual após arranque a frio.",
            solution="Sem intervenção; monitorização nas leituras seguintes.",
            operator="Ana Júlia", opened=ago(days=1, hours=12),
            history=[
                (ago(days=1, hours=8), "Carlos Manuel", "ABERTA", "RESOLVIDA", "Valor normalizou."),
                (ago(days=1), "Carlos Manuel", "RESOLVIDA", "FECHADA", None),
            ],
        )
        inc_gg9 = make_incident(
            groups, "GG9",
            title="Sobrecarga durante pico de procura",
            type="OPERACIONAL", severity="BAIXA", status="RESOLVIDA",
            description="Carga a 105% da nominal durante o pico da manhã.",
            cause="Procura elevada na rede.",
            solution="Redistribuição de carga para o GG8.",
            operator="Nelson Cadete", opened=ago(days=2, hours=10),
            history=[(ago(days=2, hours=8), "Nelson Cadete", "ABERTA", "RESOLVIDA", None)],
        )
        incidents = [inc_gg2, inc_gg7, inc_gg4, inc_gg1, inc_gg5, inc_gg9]
        db.add_all(incidents)
        db.flush()

        # ------------------------------------------------------------ MANUTENÇÃO
        orders = [
            make_order(groups, "GG6", title="Revisão geral das 8000 horas", type="PREVENTIVA",
                       priority="MEDIA", status="EM_ANDAMENTO", scheduled=ago(days=2), started=ago(days=2),
                       technician="Carlos Manuel", description="Revisão completa conforme plano do fabricante.",
                       estimated=840000, notes="Cabeças de cilindro desmontadas."),
            make_order(groups, "GG4", title="Substituição do motor de arranque", type="CORRETIVA",
                       priority="ALTA", status="AGENDADA", scheduled=ahead(days=1), technician="Carlos Manuel",
                       estimated=224000, incident=inc_gg4, notes="A aguardar entrega da peça."),
            make_order(groups, "GG2", title="Inspeção do circuito de arrefecimento do óleo", type="URGENTE",
                       priority="ALTA", status="AGENDADA", scheduled=ahead(hours=6), technician="Nelson Cadete",
                       estimated=63000, incident=inc_gg2),
            make_order(groups, "GG1", title="Substituição do termóstato", type="CORRETIVA", priority="ALTA",
                       status="CONCLUIDA", scheduled=ago(hours=16), started=ago(hours=15),
                       completed=ago(hours=11), technician="Carlos Manuel", estimated=42000, actual=37800,
                       hours=4, incident=inc_gg1),
            make_order(groups, "GG9", title="Substituição das velas de ignição", type="PREVENTIVA",
                       priority="MEDIA", status="AGENDADA", scheduled=ago(days=3), technician="Ana Júlia",
                       estimated=126000, notes="Adiada por necessidade de produção."),
            make_order(groups, "GG3", title="Análise de vibrações", type="PREDITIVA", priority="BAIXA",
                       status="AGENDADA", scheduled=ahead(days=5), technician="Ana Júlia", estimated=56000),
            make_order(groups, "GG8", title="Troca de óleo e filtros", type="PREVENTIVA", priority="MEDIA",
                       status="CONCLUIDA", scheduled=ago(days=12), started=ago(days=12),
                       completed=ago(days=12) + timedelta(hours=5), technician="Nelson Cadete",
                       estimated=175000, actual=164500, hours=5),
            make_order(groups, "GG5", title="Troca de óleo e filtros", type="PREVENTIVA", priority="MEDIA",
                       status="CONCLUIDA", scheduled=ago(days=20), started=ago(days=20),
                       completed=ago(days=20) + timedelta(hours=4), technician="Carlos Manuel",
                       estimated=98000, actual=96600, hours=4),
            make_order(groups, "GG7", title="Calibração de sensores de pressão", type="PREVENTIVA",
                       priority="BAIXA", status="CANCELADA", scheduled=ago(days=8), technician="Ana Júlia",
                       estimated=28000, notes="Cancelada: incluída na próxima revisão geral."),
        ]
        db.add_all(orders)
        db.commit()

        print(f"Ocorrências criadas:          {len(incidents)}")
        print(f"Ordens de manutenção criadas: {len(orders)}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_operations()
