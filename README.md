# Central Termoelétrica — Sistema de Apoio à Decisão

Aplicação web para acompanhar os 9 grupos geradores da central (GG1–GG7 Guascor 0,952 MW, GG8–GG9 Waukesha 2,4 MW): leituras operacionais, alertas automáticos, ocorrências, manutenção, estatísticas e importação de dados.

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 17 |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Autenticação | JWT (sessão de 8 h) com perfis Operador / Gestor / Administrador |

## Funcionalidades

- **Dashboard** — potência instalada e atual, energia das últimas 24 h, estado de cada grupo e alertas abertos.
- **Leituras** — registo manual com validação, histórico com filtros e paginação, gráfico de potência por grupo.
- **Alertas** — gerados automaticamente quando uma leitura ultrapassa os limites configurados; escalam de aviso para crítico e resolvem-se quando o valor normaliza.
- **Ocorrências** — fluxo Aberta → Em análise → Em execução → Resolvida → Fechada, com cronologia e notas; podem ser abertas a partir de um alerta.
- **Manutenção** — ordens preventivas/corretivas/preditivas/urgentes; iniciar coloca o grupo em manutenção, concluir regista custos (MT) e liberta o grupo; ordens em atraso assinaladas.
- **Estatísticas** — energia, disponibilidade, utilização, fator de carga, MTTR e custos por período (7/30/90 dias) e por grupo.
- **Importação** — Excel/CSV com pré-visualização e validação linha a linha; histórico com erros.
- **Utilizadores e configurações** — gestão de contas e perfis, alteração de palavra-passe, edição dos limites de alarme.

### Perfis

| Perfil | Pode |
|---|---|
| Operador | Consultar tudo; registar leituras; reconhecer/resolver alertas; abrir e acompanhar ocorrências; iniciar/concluir manutenção |
| Gestor | Tudo o que o operador faz + agendar/cancelar manutenção, editar limites de alarme, importar dados |
| Administrador | Acesso total, incluindo gestão de utilizadores e recálculo de alertas |

## Instalação (desenvolvimento)

Requisitos: Docker, Python 3.12, Node.js 20+.

### 1. Base de dados

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
```

Criar `backend/.env` a partir de `.env.example` e definir um segredo próprio:

```
DATABASE_URL=postgresql+psycopg2://central_app:alterar_esta_password@localhost:5432/central_termoeletrica
JWT_SECRET=<uma cadeia aleatória longa>
```

Criar as tabelas e os dados de demonstração:

```bash
alembic upgrade head
python seed_all.py
uvicorn app.main:app --reload
```

A API fica em http://localhost:8000 (documentação interativa em `/docs`).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:3000. Se a API estiver noutro endereço, definir `NEXT_PUBLIC_API_URL`.

## Utilizadores iniciais

Criados por `seed_users.py` (também chamado por `seed_all.py`) com a palavra-passe **`Central@2026`** — altere-a em *Configurações* após o primeiro acesso.

| Utilizador | Perfil |
|---|---|
| `admin` | Administrador |
| `carlos.manuel` | Gestor |
| `ana.julia` | Operador |
| `nelson.cadete` | Operador |

## Scripts de dados (`backend/`)

| Script | Efeito |
|---|---|
| `seed_all.py` | Repõe **todos** os dados de demonstração sem perguntas (mantém os utilizadores) |
| `seed_users.py` | Cria perfis e utilizadores em falta (não altera os existentes) |
| `seed_data.py` | Recria os 9 grupos geradores |
| `seed_readings.py` | Gera 30 dias de leituras (8 por dia) com cenários de alerta e recalcula os alertas |
| `seed_operations.py` | Cria ocorrências e ordens de manutenção coerentes com os dados |

> `seed_all.py`, `seed_data.py` e `seed_readings.py` **apagam** os dados existentes dessas tabelas — não os execute numa base de dados em produção.

## Importação de leituras

Descarregue o modelo em *Importação → Descarregar modelo*. Colunas obrigatórias: **Grupo**, **Data e hora** (`dd/mm/aaaa hh:mm`) e **Estado** (`Em operação`, `Parado`, `Manutenção`). São aceites cabeçalhos em português com ou sem unidades (`Temp. óleo (°C)`) ou os nomes técnicos (`oil_temperature`), decimais com vírgula ou ponto, CSV separado por `;` ou `,`. Leituras repetidas (mesmo grupo e data/hora) e datas no futuro são rejeitadas.

## Estrutura

```
backend/
  app/
    core/        configuração, base de dados, segurança e autenticação
    models/      modelos SQLAlchemy
    schemas/     modelos Pydantic (pedidos/respostas)
    routers/     endpoints da API
    services/    motor de alertas e importação
  database/migrations/   migrações Alembic
frontend/
  app/
    components/  componentes partilhados (tabelas, gráficos, formulários)
    hooks/       acesso a dados com paginação
    lib/         autenticação, formatação, rótulos
    services/api.ts      cliente da API
```
