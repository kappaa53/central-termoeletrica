"""Repõe todos os dados de demonstração (sem perguntas).

Ordem: grupos -> leituras (+ alertas) -> ocorrências e manutenção.
ATENÇÃO: apaga todos os dados existentes destas tabelas.

Uso:  python seed_all.py
"""
from seed_data import seed_groups
from seed_operations import seed_operations
from seed_readings import seed_readings

if __name__ == "__main__":
    seed_groups(force=True)
    seed_readings(force=True)
    seed_operations()
