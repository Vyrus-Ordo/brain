<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Stack: React + Node.js](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-blue.svg)
![PRD: v1.0](https://img.shields.io/badge/PRD-v1.0-green.svg)

</div>

# Brain — Quiz Multiplayer

Quiz multiplayer em tempo real com React, Node.js, Socket.io e PostgreSQL. Deploy via Docker em VPS próprio.

## Stack

| Camada    | Tecnologia                                   |
|-----------|----------------------------------------------|
| Frontend  | React 19 + Vite + TypeScript + TailwindCSS   |
| Backend   | Node.js + Express + Socket.io                |
| Banco     | PostgreSQL (compartilhado no VPS)            |
| Realtime  | Socket.io (WebSocket)                        |
| Deploy    | Docker Compose + nginx reverso               |

---

## Estrutura do Projeto

```
brain/
├── frontend/              # React + Vite (SPA + proxy nginx interno)
├── backend-node/          # Express + Socket.io (porta 3100)
├── backend/               # Migrações SQL legadas (referência)
├── vps/
│   ├── init-db.sql        # Schema + seed do banco (PostgreSQL)
│   ├── nginx-brain.conf   # Config do infra-nginx para brain.privo.app.br
│   └── setup.sh           # Script de deploy automatizado
├── docker-compose.yml     # Orquestra brain-backend e brain-frontend
└── .env.example           # Template de variáveis de ambiente
```

---

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

Crie `backend-node/.env`:

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

> O Vite proxia `/api` e `/socket.io` para `localhost:3100` automaticamente em desenvolvimento.

---

## Deploy no VPS

### Pré-requisitos no VPS

- Docker + Docker Compose instalados
- Container `postgres` rodando na rede `infra-network`
- Container `infra-nginx` rodando na rede `infra-network`
- Domínio `brain.privo.app.br` apontando para o IP do VPS

### 1. Clonar o repositório

```bash
git clone <url-do-repo> /opt/brain
cd /opt/brain
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
nano .env
```

Preencha com os valores reais:

```env
DATABASE_URL=postgresql://postgres:<SENHA>@postgres:5432/brain
PORT=3100
ALLOWED_ORIGINS=https://brain.privo.app.br
```

> A senha do postgres está no `.env` do `/opt/infra`.

### 3. Executar o script de setup

```bash
chmod +x vps/setup.sh && ./vps/setup.sh
```

O script faz automaticamente:

1. Cria o banco `brain` no postgres compartilhado (ignora se já existir)
2. Aplica o schema e seed completo (`vps/init-db.sql`) — tabelas + 50 perguntas
3. Faz build das imagens Docker (`brain-backend` e `brain-frontend`)
4. Sobe os containers via `docker compose up -d`

### 4. Configurar SSL (primeira vez)

```bash
certbot certonly --webroot -w /var/www/html -d brain.privo.app.br
```

### 5. Adicionar o site ao infra-nginx

```bash
docker cp vps/nginx-brain.conf infra-nginx:/etc/nginx/conf.d/brain.conf
docker exec infra-nginx nginx -s reload
```

O `nginx-brain.conf` configura:
- Redirect HTTP → HTTPS
- SSL/TLS com certificado Let's Encrypt
- Proxy reverso para `brain-frontend:80`
- Suporte a WebSocket (`/socket.io/`) com upgrade de conexão
- Headers de segurança (HSTS, X-Frame-Options, X-Content-Type-Options)

### 6. Verificar o deploy

```bash
# Status dos containers
docker compose -f /opt/brain/docker-compose.yml ps

# Logs em tempo real
docker compose -f /opt/brain/docker-compose.yml logs -f

# Health check do backend
curl http://localhost:3100/health
```

Acesse: **https://brain.privo.app.br**

---

## Atualizar o Deploy

```bash
cd /opt/brain
git pull
docker compose up -d --build
```

> O banco **não** é recriado no update. Para aplicar novas migrações SQL:
> ```bash
> docker exec -i postgres psql -U postgres -d brain < vps/init-db.sql
> ```

---

## Arquitetura de Rede (VPS)

```
Internet
   │
   ▼
infra-nginx (infra-network)
   │  HTTPS :443      →  brain-frontend:80
   │  /socket.io/     →  brain-frontend:80  (WebSocket upgrade)
   ▼
brain-frontend (nginx interno)
   │  /api/*          →  brain-backend:3100
   │  /socket.io/     →  brain-backend:3100
   │  /*              →  SPA (index.html)
   ▼
brain-backend (Express + Socket.io :3100)
   │
   ▼
postgres (infra-network · banco: brain)
```

---

## Variáveis de Ambiente

| Variável          | Descrição                                         | Exemplo                                           |
|-------------------|---------------------------------------------------|---------------------------------------------------|
| `DATABASE_URL`    | Connection string PostgreSQL                      | `postgresql://postgres:senha@postgres:5432/brain` |
| `PORT`            | Porta do servidor backend                         | `3100`                                            |
| `ALLOWED_ORIGINS` | Origins permitidas pelo CORS (separadas por `,`)  | `https://brain.privo.app.br`                      |

> O frontend não possui variáveis de ambiente em produção — todas as chamadas passam pelo nginx interno do container.

---

## Documentação

- [brain-design-system.md](brain-design-system.md) — Design System
- [prd.md](prd.md) — Requisitos do produto
- [frontend/docs/spec-frontend.md](frontend/docs/spec-frontend.md) — Especificação do frontend
- [backend/docs/spec-backend.md](backend/docs/spec-backend.md) — Especificação original (referência)

---

## Licença

MIT © 2026 [Vyrus Order - Brain](https://github.com/Vyrus-Ordo/brain)
