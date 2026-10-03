"""Cria os perfis e os utilizadores iniciais (idempotente).

Não altera utilizadores que já existam (nem as suas palavras-passe).
ALTERE AS PALAVRAS-PASSE INICIAIS depois do primeiro acesso.

Uso:  python seed_users.py
"""
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User
from app.services.alert_engine import now

ROLES = [
    ("ADMIN", "Administrador: gestão de utilizadores e configuração do sistema"),
    ("GESTOR", "Gestão: manutenção, limites de alarme e estatísticas"),
    ("OPERADOR", "Operação: leituras, alertas e ocorrências"),
]

INITIAL_PASSWORD = "Central@2026"

USERS = [
    ("Administrador do Sistema", "admin", "ADMIN"),
    ("Carlos Manuel", "carlos.manuel", "GESTOR"),
    ("Ana Júlia", "ana.julia", "OPERADOR"),
    ("Nelson Cadete", "nelson.cadete", "OPERADOR"),
]


def seed_users():
    db = SessionLocal()
    try:
        roles = {r.name: r for r in db.scalars(select(Role))}
        for name, description in ROLES:
            if name not in roles:
                roles[name] = Role(name=name, description=description, active=True)
                db.add(roles[name])
        db.flush()

        created = []
        for full_name, username, role in USERS:
            exists = db.scalar(select(User.id).where(User.username == username))
            if exists:
                continue
            db.add(
                User(
                    name=full_name,
                    username=username,
                    password_hash=hash_password(INITIAL_PASSWORD),
                    role=roles[role],
                    active=True,
                    created_at=now(),
                )
            )
            created.append((username, role))
        db.commit()

        if created:
            print("Utilizadores criados (palavra-passe inicial: %s):" % INITIAL_PASSWORD)
            for username, role in created:
                print(f"   {username:<15} {role}")
        else:
            print("Utilizadores já existentes - nada a fazer.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
