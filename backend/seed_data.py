import sys
import os

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.group import Group
from decimal import Decimal

def seed_groups():
    db = SessionLocal()
    try:
        # Dados dos grupos
        groups_data = [
            {'code': 'GG1', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-001', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG2', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-002', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG3', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-003', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG4', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-004', 
             'active': True, 'status': 'Parado'},
            {'code': 'GG5', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-005', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG6', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-006', 
             'active': True, 'status': 'Manutenção'},
            {'code': 'GG7', 'manufacturer': 'Guascor', 'engine_model': 'G-16', 'cylinders': 16, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('0.952'), 'serial_number': 'GU-007', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG8', 'manufacturer': 'Waukesha', 'engine_model': 'VHP-12', 'cylinders': 12, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('2.4'), 'serial_number': 'WK-008', 
             'active': True, 'status': 'Em operação'},
            {'code': 'GG9', 'manufacturer': 'Waukesha', 'engine_model': 'VHP-12', 'cylinders': 12, 
             'cylinder_configuration': 'V', 'nominal_power_mw': Decimal('2.4'), 'serial_number': 'WK-009', 
             'active': True, 'status': 'Em operação'},
        ]
        
        # Verificar se já existem grupos
        existing = db.query(Group).count()
        if existing > 0:
            print(f"⚠️  Já existem {existing} grupos no banco de dados.")
            resposta = input("Deseja recriar todos os grupos? (s/N): ")
            if resposta.lower() != 's':
                print("❌ Operação cancelada.")
                return
            
            # Remover grupos existentes
            db.query(Group).delete()
            print(f"🗑️  {existing} grupos removidos.")
        
        # Inserir novos grupos
        for data in groups_data:
            group = Group(**data)
            db.add(group)
        
        db.commit()
        print(f"✅ {len(groups_data)} grupos inseridos com sucesso!")
        
        # Listar os grupos inseridos
        print("\n📋 Grupos no banco de dados:")
        groups = db.query(Group).order_by(Group.code).all()
        for g in groups:
            print(f"   {g.code} - {g.manufacturer} - {g.nominal_power_mw} MW - {g.status}")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao inserir dados: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando seed dos grupos geradores...")
    seed_groups()