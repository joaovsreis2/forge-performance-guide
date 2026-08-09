# Forge Backend

Backend da implementação oficial do Forge. Este diretório contém o monólito modular Django,
conectado ao PostgreSQL e consumido pelo frontend React em `frontend/` por meio da API JSON.

O frontend React preserva a experiência visual validada no protótipo; o Django permanece como
fonte de verdade para autenticação, regras de domínio e persistência.

Fase atual: integração React + Django API. Phase 4 — Workout Execution já
inclui preview de treino, criação de sessão, snapshots históricos, registro de séries, pausa,
retomada, cancelamento, conclusão, rest timer e resumo.
Phase 5 já inclui manifest PWA, service worker, fallback offline, fila IndexedDB para séries
registradas sem conexão e `SyncOperation` para rastrear operações sincronizadas no servidor.
Phase 6 já inclui histórico recente, recordes pessoais derivados de séries concluídas,
recuperação diária, hábitos e medições corporais.
Phase 7 já inclui ledger de experiência, projeção de nível, XP por treino/série/exercício/recorde,
recuperação, hábito e medição, com unicidade por fonte e cap diário para hábitos.

## Versões

- Python 3.14.6
- Django 6.0.8
- PostgreSQL 18.4
- Psycopg 3.3.4
- Ruff 0.16.1
- Pytest 9.1.1

As versões completas das dependências estão fixadas em `requirements/`.

## Estrutura

```text
backend/
├── config/              # URLs, ASGI, WSGI e settings por ambiente
├── forge/
│   ├── core/            # Fundação compartilhada e endpoints técnicos
│   ├── api/             # Contrato JSON consumido pelo frontend React
│   ├── accounts/        # Identidade e usuário customizado
│   ├── training/        # Fronteira do domínio de treino
│   └── progress/        # Fronteira do domínio de progresso
├── static/              # Arquivos estáticos globais
├── templates/           # Templates globais server-rendered
├── tests/               # Testes da fundação
└── requirements/        # Dependências fixadas
```

Os módulos `accounts`, `training` e `progress` concentram as regras de produto; `api` expõe apenas
serialização e transporte HTTP, sem duplicar essas regras.

## Configuração Local

Requisitos: Python 3.14, Docker e Docker Compose.

No PowerShell, a partir da raiz do repositório:

```powershell
Copy-Item backend/.env.example backend/.env
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements/dev.txt
docker compose --env-file backend/.env -f docker/compose.yml up -d db
backend/.venv/Scripts/python backend/manage.py migrate
backend/.venv/Scripts/python backend/manage.py runserver
```

O backend fica disponível em `http://127.0.0.1:8000/`, a API em `/api/` e o health check em
`http://127.0.0.1:8000/health/`. Para subir backend e frontend juntos, use `./run-dev.ps1` na raiz.

Para criar um superusuário:

```powershell
backend/.venv/Scripts/python backend/manage.py createsuperuser
```

Para criar uma conta comum de teste:

```powershell
backend/.venv/Scripts/python backend/manage.py create_dev_user --email teste@forge.local --password "teste123" --name "Usuário Demo" --complete-onboarding
```

Para criar um plano demo para a conta de teste:

```powershell
backend/.venv/Scripts/python backend/manage.py seed_demo_plan --email teste@forge.local
```

Para importar um plano administrativo a partir de CSV, valide primeiro:

```powershell
backend/.venv/Scripts/python backend/manage.py import_training_plan plan.csv --email teste@forge.local --plan-name "Base de Força"
```

Depois persista e, se necessário, ative o plano importado:

```powershell
backend/.venv/Scripts/python backend/manage.py import_training_plan plan.csv --email teste@forge.local --plan-name "Base de Força" --commit --activate
```

O CSV inicial exige as colunas:

```text
workout_sequence, workout_name, exercise_sequence, exercise_name, primary_metric, target_sets
```

E aceita opcionalmente:

```text
weekday, estimated_duration_minutes, target_repetitions_min, target_repetitions_max,
target_weight_kg, target_duration_seconds, target_distance_meters, rest_seconds,
technical_notes, exercise_instructions
```

## Banco Supabase para Desenvolvimento

Docker é opcional. Para usar um banco PostgreSQL gerenciado no Supabase, copie a connection string
do painel do projeto Supabase e configure `DATABASE_URL` em `backend/.env`.

Exemplo de formato:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

Use a connection string de banco, não a URL pública do projeto Supabase. A URL pública parecida com
`https://[PROJECT_REF].supabase.co` é usada pela API Supabase, não pelo Django ORM.

Depois:

```powershell
backend/.venv/Scripts/python backend/manage.py migrate
backend/.venv/Scripts/python backend/manage.py runserver
```

## Docker Compose

Depois de criar `backend/.env`:

```powershell
docker compose --env-file backend/.env -f docker/compose.yml up --build
```

O Compose inicia apenas `web` e `db`, aguarda o health check do PostgreSQL, aplica migrations e
serve o Django na porta 8000. O banco usa um volume nomeado persistente.

Para encerrar sem apagar o volume:

```powershell
docker compose --env-file backend/.env -f docker/compose.yml down
```

## Variáveis de Ambiente

`backend/.env.example` documenta todas as variáveis locais. O banco pode ser configurado por:

- `DATABASE_URL`, recomendado para Supabase/Render;
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` e
  `POSTGRES_SSLMODE`, útil para Docker local ou configuração manual.

Os settings disponíveis são:

- `config.settings.development`: debug configurável e hosts locais;
- `config.settings.test`: PostgreSQL, hashing rápido e comportamento determinístico;
- `config.settings.production`: exige secret key e hosts, habilita cookies e headers seguros.

Produção também exige origem frontend, origens CSRF e configuração SMTP. O container usa
WhiteNoise para arquivos estáticos, aplica migrations e coleta estáticos quando as respectivas
variáveis de execução estão habilitadas. Consulte `../docs/DEPLOYMENT.md`.

O projeto falha com uma mensagem explícita quando a configuração PostgreSQL está ausente. Nunca
há fallback silencioso para SQLite.

## Qualidade e Testes

Com o PostgreSQL local ativo e o ambiente configurado:

```powershell
Push-Location backend
.venv/Scripts/ruff check .
.venv/Scripts/ruff format --check .
.venv/Scripts/coverage run -m pytest
.venv/Scripts/coverage report
.venv/Scripts/coverage html
.venv/Scripts/python manage.py makemigrations --check
.venv/Scripts/python manage.py check
Pop-Location
```

Quando os testes estiverem usando Supabase ou outro PostgreSQL remoto, prefira:

```powershell
Push-Location backend
.venv/Scripts/python -m pytest --reuse-db
Pop-Location
```

Isso evita recriar o banco de teste a cada execução em conexões remotas.

O coverage mínimo inicial é 85%. Testes usam PostgreSQL porque constraints, tipos e transações
devem permanecer próximos de produção.

Para instalar os hooks na raiz do repositório:

```powershell
backend/.venv/Scripts/pre-commit install --config .pre-commit-config.yaml
```

## Migrations

Migrations são versionadas junto com as mudanças de modelo:

```powershell
backend/.venv/Scripts/python backend/manage.py makemigrations
backend/.venv/Scripts/python backend/manage.py migrate
```

## Fluxo de Treino

Com uma conta onboarded e um plano ativo:

1. acesse Today;
2. abra o treino marcado para o dia ou o plano;
3. use Preparar treino;
4. comece a sessão;
5. registre séries na tela ativa;
6. pause, retome, cancele ou finalize;
7. revise o resumo histórico.

Sessões preservam snapshots do nome do treino, exercícios, alvos, notas e descanso. Alterações
posteriores no plano não reescrevem sessões já iniciadas.

## Solução de Problemas

- `POSTGRES_* não foi configurada`: crie `backend/.env` a partir do exemplo.
- `connection refused`: confirme `docker compose ... ps` e a porta definida em `POSTGRES_PORT`.
- porta 5432 ocupada: encerre o PostgreSQL conflitante ou ajuste a porta local e as variáveis.
- migrations pendentes: execute `makemigrations --check` e versione a migration correspondente.
- health check 503: consulte os logs do Django e o health check do serviço `db`.

Não use credenciais do `.env.example` em produção.
