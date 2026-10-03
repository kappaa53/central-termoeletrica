"""Repõe todos os dados de demonstração (sem perguntas).

Ordem: utilizadores -> grupos -> leituras (+ alertas) -> ocorrências e manutenção.
ATENÇÃO: apaga os grupos, leituras, alertas, ocorrências e manutenção existentes.
Os utilizadores existentes são mantidos.

Uso:  python seed_all.py
"""
from seed_data import seed_groups
from seed_operations import seed_operations
from seed_readings import seed_readings
from seed_users import seed_users

if __name__ == "__main__":
    seed_users()
    seed_groups(force=True)
    seed_readings(force=True)
    seed_operations()
