# Brain Multiplayer Quiz

Este projeto é um sistema de quiz multiplayer, composto por frontend (React + Vite), backend (Supabase com funções customizadas) e documentação de design e produto.

## Estrutura do Projeto

- **frontend/**: Aplicação web em React (Vite, TypeScript, TailwindCSS)
- **backend/**: Scripts, funções e migrações para Supabase
- **brain/**: Utilitários e scripts auxiliares
- **docs e arquivos .md**: Documentação de design, produto e especificações

## Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x
- Supabase CLI (opcional, para rodar backend local)

## Instalação e Execução

### 1. Clonar o repositório

```bash
git clone <url-do-repo>
cd brain
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Acesse: http://localhost:5173

### 3. Backend (Supabase)

- Instale o [Supabase CLI](https://supabase.com/docs/guides/cli)
- Configure o projeto:

```bash
cd backend
supabase init
supabase start
```

- Para aplicar as migrações:

```bash
supabase db reset
```

- Para rodar funções customizadas:

```bash
cd backend/supabase/functions
# Edite/implante funções conforme necessário
```

### 4. Variáveis de ambiente

- Configure as variáveis de ambiente no frontend (`.env`) com as chaves do Supabase:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Scripts Úteis

- `npm run dev` — inicia o frontend em modo desenvolvimento
- `supabase start` — inicia o backend local
- `supabase db reset` — reseta e aplica todas as migrações

## Documentação

- [brain-design-system.md](brain-design-system.md): Design System
- [prd.md](prd.md): Documento de requisitos do produto
- [backend/docs/spec-backend.md](backend/docs/spec-backend.md): Especificação do backend
- [frontend/docs/spec-frontend.md](frontend/docs/spec-frontend.md): Especificação do frontend

## Estrutura de Pastas

```
brain/
backend/
  docs/
  supabase/
    functions/
    migrations/
frontend/
  src/
  public/
  docs/
```

## Contribuição

1. Crie uma branch a partir da `main`
2. Faça suas alterações
3. Abra um Pull Request

## Licença

Defina a licença do projeto aqui.
