# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Não publicado]

## 2026-05-14

### Adicionado

- Backend Node.js com Express e Socket.io substituindo as Edge Functions do Supabase
- `backend-node/src/routes/salas.ts` — API REST completa para salas, jogadores, respostas e ranking
- `backend-node/src/routes/perguntas.ts` — endpoint de perguntas com suporte a tema e limite
- `backend-node/src/socket/index.ts` — relay de eventos em tempo real via Socket.io
- `frontend/src/lib/api.ts` — cliente HTTP centralizado para o novo backend
- `frontend/src/lib/socket.ts` — singleton Socket.io compartilhado entre hooks
- `frontend/Dockerfile` — build multi-stage (Node → nginx) com proxy interno para `/api` e `/socket.io`
- `frontend/nginx.conf` — configuração nginx com proxy reverso e suporte a WebSocket
- `backend-node/Dockerfile` — imagem de produção do backend
- `docker-compose.yml` — orquestração dos containers `brain-backend` e `brain-frontend`
- `.env.example` — template de variáveis de ambiente
- `vps/init-db.sql` — schema completo + seed de 50 perguntas em 5 temas (sem dependência do Supabase CLI)
- `vps/nginx-brain.conf` — configuração para o `infra-nginx` existente no VPS com SSL
- `vps/setup.sh` — script de deploy automatizado para VPS com Docker

### Modificado

- Todos os hooks do frontend migrados de `@supabase/supabase-js` para `api.ts` + `socket.ts`:
  - `useCreateRoom`, `useJoinRoom`, `useStartGame`, `useSubmitAnswer`
  - `useRanking`, `useQuestions`, `useRoomPresence`, `useGameSync`
- `GamePage.tsx` — substituídas chamadas diretas ao Supabase por `api.countRespostas`, `api.getCorrectAnswer` e `api.updateEstado`
- `RankingPage.tsx` — substituído dynamic import do Supabase por `api.updateEstado`
- `frontend/package.json` — removido `@supabase/supabase-js`, adicionado `socket.io-client`
- `frontend/vite.config.ts` — adicionado proxy de desenvolvimento para `/api` e `/socket.io`
- `README.md` — atualizado para refletir nova stack, estrutura e instruções de deploy

### Removido

- Dependência de `@supabase/supabase-js` no frontend
- Edge Functions Deno (`join-match`, `start-match`, `submit-answer`, `advance-round`, `match-state`)
- Variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Dependência do Supabase CLI para deploy

### Obsoleto

- Diretório `backend/supabase/` — mantido apenas como referência histórica das migrações e seed originais

---

## 2026-04-22

### Adicionado

- Aplicação React + Vite com TypeScript e TailwindCSS
- Autenticação anônima via Supabase Auth (ID gerado por `crypto.randomUUID()` no cliente)
- Schema do banco de dados: `salas`, `jogadores`, `perguntas`, `respostas_rodada`
- Trigger PostgreSQL `fn_compute_is_correct` para validação automática de respostas
- RPC `get_correct_answer` para o host revelar a resposta ao fim de cada rodada
- Realtime via Supabase Channels (broadcast + postgres_changes)
- Edge Functions Deno: `join-match`, `start-match`, `submit-answer`, `advance-round`, `match-state`
- Seed com 50 perguntas divididas em 5 temas: história, esportes, tecnologia, filmes e geral
- Páginas: `NicknamePage`, `HomePage`, `CreateRoomPage`, `LobbyPage`, `GamePage`, `ResultPage`, `RankingPage`, `FinalRankingPage`
- Componentes do Design System Brain: `BrainLogo`, `TimerBar`, `PrimaryButton`, `SecondaryButton`, `PlayerListItem`, `FeedbackIcon`, `SegmentedControl`, `CodeDisplay`
- RLS (Row Level Security) para acesso anônimo controlado
- Documentação: GDD, PRD, Design System, especificações de frontend e backend
