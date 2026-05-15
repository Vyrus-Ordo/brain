# Brain — Quiz Multiplayer

## Project Structure


```text
d:\projetos\brain\
├── docker-compose.yml          ← orquestra os 2 containers brain
├── .env.example                ← template de variáveis
├── backend-node/               ← NOVO: backend Node.js
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            ← Express + Socket.io
│       ├── db.ts               ← Pool PostgreSQL
│       ├── routes/salas.ts     ← toda a API REST
│       ├── routes/perguntas.ts
│       └── socket/index.ts     ← relay de broadcasts
├── frontend/
│   ├── Dockerfile              ← NOVO: multi-stage build
│   ├── nginx.conf              ← NOVO: serve SPA + proxy /api + /socket.io
│   ├── package.json            ← removido supabase, adicionado socket.io-client
│   ├── vite.config.ts          ← NOVO: proxy para dev local
│   └── src/
│       ├── lib/api.ts          ← NOVO: cliente REST
│       ├── lib/socket.ts       ← NOVO: singleton Socket.io
│       ├── lib/supabase.ts     ← neutralizado (export null)
│       └── hooks/              ← todos reescritos
└── vps/
    ├── init-db.sql             ← schema + seed completo (sem RLS)
    ├── nginx-brain.conf        ← config para o infra-nginx
    └── setup.sh                ← script de deploy no VPS
```

## 1. Clonar o repositório no VPS
git clone <repo> /opt/brain && cd /opt/brain

## 2. Criar o .env com a senha correta do postgres
cp .env.example .env
nano .env   # preencha DATABASE_URL com a senha real

## 3. Rodar o script de setup
chmod +x vps/setup.sh && ./vps/setup.sh

O script faz automaticamente:

1. Descobre a rede Docker do postgres existente
2. Cria o banco brain no postgres compartilhado
3. Aplica schema + seed (50 perguntas)
4. Cria a rede web (se não existir)
5. Faz build e sobe os containers
6. Conecta brain-frontend à rede do infra-nginx

Depois basta SSL + nginx:

```shell
certbot certonly --standalone -d brain.privo.app.br
docker cp vps/nginx-brain.conf infra-nginx:/etc/nginx/conf.d/brain.conf
docker exec infra-nginx nginx -s reload
```

Quiz multiplayer em tempo real com React, Node.js, Socket.io e PostgreSQL. Deploy via Docker em VPS próprio.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + Socket.io |
| Banco | PostgreSQL (compartilhado no VPS) |
| Realtime | Socket.io (WebSocket) |
| Deploy | Docker + nginx |

## Estrutura do Projeto

```
brain/
├── frontend/          # React + Vite
├── backend-node/      # Express + Socket.io
├── backend/           # Migrações SQL legadas (referência)
├── vps/               # Scripts de deploy
│   ├── init-db.sql    # Schema + seed do banco
│   ├── nginx-brain.conf
│   └── setup.sh
├── docker-compose.yml
└── .env.example
```

## Desenvolvimento Local

### Pré-requisitos

- Node.js >= 20.x
- PostgreSQL rodando localmente (ou via Docker)

### 1. Clonar

```bash
git clone <url-do-repo>
cd brain
```

### 2. Backend

```bash
cd backend-node
npm install
```

Crie `backend-node/.env` (ou use variáveis de shell):

```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/brain
PORT=3100
ALLOWED_ORIGINS=http://localhost:5173
```

Inicialize o banco:

```bash
psql -U postgres -c "CREATE DATABASE brain;"
psql -U postgres -d brain < vps/init-db.sql
```

Inicie o servidor:

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

O Vite já proxia `/api` e `/socket.io` para `localhost:3100` em desenvolvimento.

## Deploy no VPS

O VPS deve ter Docker e os containers `postgres`, `redis` e `infra-nginx` em execução.

```bash
# No VPS, na raiz do repositório:
cp .env.example .env
nano .env           # preencha DATABASE_URL com a senha do postgres

chmod +x vps/setup.sh
./vps/setup.sh
```

O script faz automaticamente:
1. Descobre a rede Docker do `postgres` existente
2. Cria o banco `brain` no postgres compartilhado
3. Aplica schema + seed (50 perguntas, 5 temas)
4. Faz build e sobe `brain-backend` e `brain-frontend`
5. Conecta o frontend à rede do `infra-nginx`

Depois configure SSL e nginx:

```bash
certbot certonly --standalone -d brain.privo.app.br

docker cp vps/nginx-brain.conf infra-nginx:/etc/nginx/conf.d/brain.conf
docker exec infra-nginx nginx -s reload
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do PostgreSQL |
| `PORT` | Porta do backend (padrão: `3100`) |
| `ALLOWED_ORIGINS` | Origens CORS separadas por vírgula |
| `DATA_NETWORK` | Rede Docker do postgres (auto-detectada pelo setup.sh) |

> O frontend não tem variáveis de ambiente em produção — todas as chamadas passam pelo nginx interno do container.

## Scripts Úteis

```bash
# Backend
npm run dev      # desenvolvimento com hot-reload
npm run build    # compilar TypeScript
npm start        # produção (após build)

# Frontend
npm run dev      # desenvolvimento
npm run build    # build para produção
```

## Documentação

- [brain-design-system.md](brain-design-system.md) — Design System
- [prd.md](prd.md) — Requisitos do produto
- [frontend/docs/spec-frontend.md](frontend/docs/spec-frontend.md) — Especificação do frontend
- [backend/docs/spec-backend.md](backend/docs/spec-backend.md) — Especificação original (Supabase, referência)

## Licença

Defina a licença do projeto aqui.
