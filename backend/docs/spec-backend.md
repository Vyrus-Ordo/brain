# 🏗️ Especificação Técnica de Infraestrutura — Quiz Multiplayer
### Supabase · Fases de Implementação com Prompts para IA

> Este documento é autossuficiente por fase. Cada fase contém: contexto necessário, instruções passo a passo, código completo e prompt pronto para execução por IA. A IA não precisa ler fases anteriores para executar uma fase.

---

## Índice

- [Fase 1 — Projeto Supabase e Autenticação](#fase-1)
- [Fase 2 — Schema do Banco de Dados](#fase-2)
- [Fase 3 — Row Level Security (RLS)](#fase-3)
- [Fase 4 — Edge Function: join-match](#fase-4)
- [Fase 5 — Edge Function: start-match](#fase-5)
- [Fase 6 — Edge Function: submit-answer](#fase-6)
- [Fase 7 — Edge Function: advance-round](#fase-7)
- [Fase 8 — Seed de Perguntas](#fase-8)
- [Fase 9 — Testes e Validação](#fase-9)

---

<a name="fase-1"></a>
## Fase 1 — Projeto Supabase e Autenticação

### Contexto
Criação do projeto base no Supabase e configuração de autenticação anônima. Jogadores entram sem cadastro — apenas com um nome escolhido na tela inicial. O ID gerado pelo Supabase Auth anônimo é a identidade do jogador em toda a partida.

### 1.1 Criar projeto (Interface Web)

1. Acesse https://app.supabase.com
2. Clique em **New Project**
3. Preencha:
   - **Name:** quiz-multiplayer
   - **Database Password:** gere uma senha forte e guarde
   - **Region:** South America (São Paulo) — `sa-east-1`
4. Aguarde o provisionamento (~2 min)
5. Anote o **Project URL** e a **anon key** em Settings > API

### 1.2 Habilitar autenticação anônima (Interface Web)

1. No menu lateral: **Authentication > Providers**
2. Localize **Anonymous Sign-Ins**
3. Ative o toggle **Enable anonymous sign-ins**
4. Clique em **Save**

### 1.3 Configurar variáveis de ambiente locais

Crie o arquivo `.env.local` na raiz do projeto frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para o cliente. Apenas Edge Functions a usam.

### 1.4 Instalar CLI e vincular projeto (Terminal)

```bash
npm install -g supabase
supabase login
supabase init
supabase link --project-ref SEU_PROJECT_REF
```

---

### 📋 Resumo da Fase 1

**O que foi feito:**
- Projeto Supabase criado na região São Paulo
- Autenticação anônima habilitada
- CLI instalada e projeto vinculado localmente

**Estado atual:**
- Banco de dados vazio (sem tabelas)
- Auth configurado para sessões anônimas
- Nenhuma Edge Function existe ainda

**Próxima fase:** Criar todas as tabelas do banco de dados via SQL Editor.

---

---

<a name="fase-2"></a>
## Fase 2 — Schema do Banco de Dados

### Contexto
O jogo possui 5 entidades principais: `players`, `questions`, `matches`, `match_players` e `answers`. O campo `correct_index` da tabela `questions` é o dado mais sensível — jamais deve ser exposto ao cliente antes do fim da rodada. Toda a lógica de estado da partida vive nestas tabelas.

### 2.1 Executar SQL (Interface Web > SQL Editor)

1. No menu lateral: **SQL Editor**
2. Clique em **New query**
3. Cole e execute cada bloco abaixo em sequência

---

#### Bloco 1 — Tabela `players`

```sql
CREATE TABLE public.players (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 20),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.players IS 'Perfil público do jogador, vinculado ao auth.users';
COMMENT ON COLUMN public.players.name IS 'Nome escolhido pelo jogador na tela inicial';
```

---

#### Bloco 2 — Tabela `questions`

```sql
CREATE TABLE public.questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme         TEXT NOT NULL CHECK (theme IN ('historia','esportes','tecnologia','filmes','geral')),
  text          TEXT NOT NULL CHECK (char_length(text) BETWEEN 10 AND 300),
  options       JSONB NOT NULL,
  correct_index INT  NOT NULL CHECK (correct_index IN (0, 1, 2)),
  created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN public.questions.options IS 'Array JSON com exatamente 3 strings (as opções de resposta)';
COMMENT ON COLUMN public.questions.correct_index IS 'Índice da resposta correta em options. NUNCA expor ao cliente antes do fim da rodada.';
```

---

#### Bloco 3 — Tabela `matches`

```sql
CREATE TABLE public.matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme            TEXT NOT NULL CHECK (theme IN ('historia','esportes','tecnologia','filmes','geral')),
  status           TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','in_progress','finished','cancelled')),
  host_id          UUID REFERENCES public.players(id) ON DELETE SET NULL,
  current_round    INT  NOT NULL DEFAULT 0,
  total_rounds     INT  NOT NULL DEFAULT 10 CHECK (total_rounds BETWEEN 5 AND 20),
  question_ids     UUID[] NOT NULL DEFAULT '{}',
  round_started_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON COLUMN public.matches.host_id IS 'Jogador que criou a partida. Único autorizado a chamар start-match. Se desconectar antes de iniciar, a partida é cancelada.';
COMMENT ON COLUMN public.matches.question_ids IS 'Sequência pré-sorteada de UUIDs de perguntas para esta partida';
COMMENT ON COLUMN public.matches.round_started_at IS 'Timestamp de início da rodada atual. Usado para calcular timeout de 10s.';
```

---

#### Bloco 4 — Tabela `match_players`

```sql
CREATE TABLE public.match_players (
  match_id   UUID REFERENCES public.matches(id)  ON DELETE CASCADE,
  player_id  UUID REFERENCES public.players(id)  ON DELETE CASCADE,
  score      INT  NOT NULL DEFAULT 0 CHECK (score >= 0),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disconnected')),
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);
```

---

#### Bloco 5 — Tabela `answers`

```sql
CREATE TABLE public.answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID REFERENCES public.matches(id)   ON DELETE CASCADE,
  player_id    UUID REFERENCES public.players(id)   ON DELETE CASCADE,
  question_id  UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  round        INT  NOT NULL CHECK (round > 0),
  answer_index INT  CHECK (answer_index IN (0, 1, 2)),
  is_correct   BOOLEAN,
  answered_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, player_id, round)
);

COMMENT ON COLUMN public.answers.answer_index IS 'NULL indica timeout (jogador não respondeu)';
COMMENT ON COLUMN public.answers.is_correct IS 'Calculado pela Edge Function no momento do registro';
```

---

#### Bloco 6 — Índices de performance

```sql
CREATE INDEX idx_matches_status_theme   ON public.matches(status, theme);
CREATE INDEX idx_match_players_score    ON public.match_players(match_id, score DESC);
CREATE INDEX idx_answers_match_round    ON public.answers(match_id, round);
CREATE INDEX idx_questions_theme        ON public.questions(theme);
```

---

### 📋 Resumo da Fase 2

**O que foi feito:**
- 5 tabelas criadas: `players`, `questions`, `matches`, `match_players`, `answers`
- `matches.host_id` registra o criador da partida — único autorizado a iniciá-la
- `matches.status` inclui o valor `cancelled` para partidas abortadas por desconexão do host
- Constraints de integridade em todos os campos críticos
- `correct_index` existe no banco mas será bloqueado por RLS na próxima fase
- Índices criados para as queries mais frequentes

**Estado do banco:**
```
players          — vazia
questions        — vazia (seed na Fase 8)
matches          — vazia
match_players    — vazia
answers          — vazia
```

**Próxima fase:** Configurar RLS para garantir que `correct_index` nunca chegue ao cliente e que jogadores só acessem dados de suas próprias partidas.

---

---

<a name="fase-3"></a>
## Fase 3 — Row Level Security (RLS)

### Contexto
RLS é a camada de segurança do PostgreSQL que impede o cliente de acessar dados que não lhe pertencem. A regra mais crítica: bloquear `correct_index` da tabela `questions` para qualquer usuário autenticado. Edge Functions usam `service_role` e ignoram RLS — por isso podem ler o campo.

### 3.1 Executar SQL (Interface Web > SQL Editor)

---

#### Bloco 1 — Habilitar RLS em todas as tabelas

```sql
ALTER TABLE public.players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers       ENABLE ROW LEVEL SECURITY;
```

---

#### Bloco 2 — Políticas para `players`

```sql
CREATE POLICY "players_select_own"
  ON public.players FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "players_insert_own"
  ON public.players FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "players_update_own"
  ON public.players FOR UPDATE
  USING (id = auth.uid());
```

---

#### Bloco 3 — Políticas para `questions` + view segura

```sql
-- Revoga acesso direto à tabela (bloqueia correct_index)
REVOKE SELECT ON public.questions FROM authenticated;

-- View pública sem correct_index
CREATE VIEW public.questions_public AS
  SELECT id, theme, text, options
  FROM public.questions;

GRANT SELECT ON public.questions_public TO authenticated;
```

---

#### Bloco 4 — Políticas para `matches`

```sql
CREATE POLICY "matches_select_participant"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    status = 'lobby'
    OR id IN (
      SELECT match_id FROM public.match_players
      WHERE player_id = auth.uid()
    )
  );
```

---

#### Bloco 5 — Políticas para `match_players`

```sql
CREATE POLICY "match_players_select_participant"
  ON public.match_players FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT match_id FROM public.match_players
      WHERE player_id = auth.uid()
    )
  );
```

---

#### Bloco 6 — Políticas para `answers`

```sql
CREATE POLICY "answers_select_own"
  ON public.answers FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- Nenhum INSERT direto para o cliente. Apenas Edge Functions (service_role).
```

---

#### Bloco 7 — Verificação

```sql
-- Deve retornar apenas: id, theme, text, options (sem correct_index)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'questions_public';

-- Deve retornar rowsecurity = true para todas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('players','questions','matches','match_players','answers');
```

---

### 📋 Resumo da Fase 3

**O que foi feito:**
- RLS habilitado nas 5 tabelas
- `correct_index` inacessível ao cliente via REVOKE + view `questions_public`
- Jogadores isolados: só acessam dados das próprias partidas
- Edge Functions (service_role) ignoram RLS e têm acesso total

**Regra de segurança central:**
```
Cliente         → usa: questions_public  (sem correct_index)
Edge Function   → usa: questions         (com correct_index, via service_role)
```

**Próxima fase:** Edge Function `join-match`.

---

---

<a name="fase-4"></a>
## Fase 4 — Edge Function: `join-match`

### Contexto
Coloca o jogador em uma partida existente em lobby com o tema solicitado e menos de 8 jogadores. Se não houver, cria nova partida e sorteia as perguntas. Retorna o `match_id` para o cliente se inscrever no canal Realtime.

**Estado do banco neste ponto:** tabelas criadas, RLS ativo, banco vazio (seed na Fase 8).

### 4.1 Criar a função (Terminal)

```bash
supabase functions new join-match
```

### 4.2 Código — `supabase/functions/join-match/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { theme } = await req.json();
    const validThemes = ["historia", "esportes", "tecnologia", "filmes", "geral"];
    if (!theme || !validThemes.includes(theme)) {
      return new Response(JSON.stringify({ error: "Invalid or missing theme" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se jogador já está em uma partida ativa
    const { data: activeMatch } = await supabaseAdmin
      .from("match_players")
      .select("match_id, matches!inner(status)")
      .eq("player_id", user.id)
      .in("matches.status", ["lobby", "in_progress"])
      .maybeSingle();

    if (activeMatch) {
      return new Response(JSON.stringify({
        match_id: activeMatch.match_id,
        already_joined: true,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Busca partida disponível com menos de 8 jogadores
    const { data: availableMatches } = await supabaseAdmin
      .from("matches")
      .select("id, match_players(count)")
      .eq("status", "lobby")
      .eq("theme", theme);

    let matchId: string | null = null;

    if (availableMatches) {
      const openMatch = availableMatches.find((m: any) => {
        const count = m.match_players?.[0]?.count ?? 0;
        return count < 8;
      });
      if (openMatch) matchId = openMatch.id;
    }

    // Cria nova partida se necessário
    if (!matchId) {
      const TOTAL_ROUNDS = 10;

      const { data: questions, error: qError } = await supabaseAdmin
        .from("questions")
        .select("id")
        .eq("theme", theme);

      if (qError || !questions || questions.length < TOTAL_ROUNDS) {
        return new Response(JSON.stringify({
          error: `Not enough questions for theme '${theme}'. Need ${TOTAL_ROUNDS}, found ${questions?.length ?? 0}.`,
        }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const shuffled = questions
        .map((q: any) => ({ id: q.id, sort: Math.random() }))
        .sort((a: any, b: any) => a.sort - b.sort)
        .slice(0, TOTAL_ROUNDS)
        .map((q: any) => q.id);

      const { data: newMatch, error: matchError } = await supabaseAdmin
        .from("matches")
        .insert({ theme, total_rounds: TOTAL_ROUNDS, question_ids: shuffled, host_id: user.id })
        .select("id")
        .single();

      if (matchError || !newMatch) {
        return new Response(JSON.stringify({ error: "Failed to create match" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      matchId = newMatch.id;
    }

    // Adiciona jogador
    const { error: joinError } = await supabaseAdmin
      .from("match_players")
      .insert({ match_id: matchId, player_id: user.id });

    if (joinError) {
      return new Response(JSON.stringify({ error: "Failed to join match" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count } = await supabaseAdmin
      .from("match_players")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId);

    // Verifica se o jogador atual é o host da partida
    const { data: matchInfo } = await supabaseAdmin
      .from("matches")
      .select("host_id")
      .eq("id", matchId)
      .single();

    const isHost = matchInfo?.host_id === user.id;

    return new Response(JSON.stringify({
      match_id: matchId,
      player_count: count ?? 1,
      already_joined: false,
      is_host: isHost,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 4.3 Deploy

```bash
supabase functions deploy join-match
```

---

### 📋 Resumo da Fase 4

**O que foi feito:** Edge Function `join-match` criada e deployada.

**Contrato:**
```
POST /functions/v1/join-match
Body:   { "theme": "tecnologia" }
Return: { "match_id": "uuid", "player_count": 4, "already_joined": false, "is_host": true }
```

**Lógica:** busca lobby com tema → entra; se não existir → cria, sorteia 10 perguntas e registra o criador como `host_id`.

**`is_host`** indica ao frontend se deve exibir o botão "Iniciar partida". Apenas o jogador que criou a partida recebe `true`.

**Próxima fase:** Edge Function `start-match` — inicia a partida, faz primeiro broadcast e inicializa o timer.

---

---

<a name="fase-5"></a>
## Fase 5 — Edge Function: `start-match`

### Contexto
Chamada pelo host para iniciar a partida. O host é o jogador que criou a partida (`host_id` em `matches`). Regras:

- Apenas o host pode chamar esta função — qualquer outro jogador recebe `403`
- Mínimo de 3 jogadores presentes
- Se o host estiver marcado como `disconnected` em `match_players`, a partida é cancelada automaticamente (`status = 'cancelled'`)

Muda status para `in_progress`, define `current_round = 1` e faz broadcast do evento `round_started` com a primeira pergunta — **sem** `correct_index`.

**Pré-requisitos:** Fase 4 concluída. Partida em status `lobby` com ao menos 3 jogadores.

### 5.1 Criar a função

```bash
supabase functions new start-match
```

### 5.2 Código — `supabase/functions/start-match/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id } = await req.json();
    if (!match_id) {
      return new Response(JSON.stringify({ error: "match_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Busca partida em lobby ---
    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .eq("status", "lobby")
      .single();

    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found or not in lobby" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Valida que o requisitante é o host ---
    if (match.host_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the host can start the match" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Verifica se o host está conectado ---
    const { data: hostStatus } = await supabaseAdmin
      .from("match_players")
      .select("status")
      .eq("match_id", match_id)
      .eq("player_id", user.id)
      .single();

    if (hostStatus?.status === "disconnected") {
      // Host desconectado antes de iniciar — cancela a partida
      await supabaseAdmin
        .from("matches")
        .update({ status: "cancelled" })
        .eq("id", match_id);

      // Notifica jogadores no lobby via Realtime
      const cancelChannel = supabaseAdmin.channel(`match:${match_id}`);
      await cancelChannel.subscribe();
      await cancelChannel.send({
        type: "broadcast",
        event: "match_cancelled",
        payload: { reason: "host_disconnected" },
      });

      return new Response(JSON.stringify({ error: "Host is disconnected. Match cancelled." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Conta jogadores ativos ---
    const { count: playerCount } = await supabaseAdmin
      .from("match_players")
      .select("*", { count: "exact", head: true })
      .eq("match_id", match_id)
      .eq("status", "active");

    if (!playerCount || playerCount < 3) {
      return new Response(JSON.stringify({
        error: `Need at least 3 active players to start. Current: ${playerCount ?? 0}`,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Atualiza partida para in_progress ---
    const roundStartedAt = new Date().toISOString();

    await supabaseAdmin
      .from("matches")
      .update({ status: "in_progress", current_round: 1, round_started_at: roundStartedAt })
      .eq("id", match_id);

    // --- Busca primeira pergunta SEM correct_index ---
    const firstQuestionId = match.question_ids[0];
    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("id, text, options")
      .eq("id", firstQuestionId)
      .single();

    // --- Broadcast ---
    const channel = supabaseAdmin.channel(`match:${match_id}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "round_started",
      payload: {
        round: 1,
        total_rounds: match.total_rounds,
        question,
        started_at: roundStartedAt,
        duration_seconds: 10,
      },
    });

    return new Response(JSON.stringify({ status: "started", round: 1 }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 5.3 Deploy

```bash
supabase functions deploy start-match
```

---

### 📋 Resumo da Fase 5

**O que foi feito:** Edge Function `start-match` criada e deployada.

**Contrato:**
```
POST /functions/v1/start-match
Body:      { "match_id": "uuid" }
Return:    { "status": "started", "round": 1 }
           { "error": "Only the host can start the match" }      → 403
           { "error": "Host is disconnected. Match cancelled." } → 422
Broadcast: evento "round_started"    → partida iniciada com sucesso
           evento "match_cancelled"  → host desconectou, partida abortada
```

**Regras de host:**
- Apenas `matches.host_id === auth.uid()` pode chamar esta função
- Se o host estiver com `status = 'disconnected'` em `match_players`, a partida é cancelada e todos os jogadores no lobby recebem o evento `match_cancelled` via Realtime

**Próxima fase:** Edge Function `submit-answer` — registra resposta com validação de timeout e idempotência.

---

---

<a name="fase-6"></a>
## Fase 6 — Edge Function: `submit-answer`

### Contexto
Recebe a resposta do jogador. Valida: timer não expirou, jogador não respondeu ainda nesta rodada, partida em andamento. Compara com `correct_index` via service_role. O cliente recebe apenas `{ accepted: true }` — o resultado chega via broadcast no `round_ended`.

**Pré-requisitos:** Fases 2-5 concluídas. Função SQL `increment_score` (criada nesta fase).

### 6.1 Criar a função

```bash
supabase functions new submit-answer
```

### 6.2 Função SQL auxiliar (SQL Editor)

Execute antes do deploy:

```sql
CREATE OR REPLACE FUNCTION public.increment_score(
  p_match_id UUID,
  p_player_id UUID
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.match_players
  SET score = score + 1
  WHERE match_id = p_match_id
    AND player_id = p_player_id;
$$;
```

### 6.3 Código — `supabase/functions/submit-answer/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROUND_DURATION_SECONDS = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id, answer_index } = await req.json();

    if (!match_id || answer_index === undefined || answer_index === null) {
      return new Response(JSON.stringify({ error: "match_id and answer_index are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (![0, 1, 2].includes(answer_index)) {
      return new Response(JSON.stringify({ error: "answer_index must be 0, 1 or 2" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("id, status, current_round, question_ids, round_started_at")
      .eq("id", match_id)
      .single();

    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.status !== "in_progress") {
      return new Response(JSON.stringify({ error: "Match is not in progress" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabaseAdmin
      .from("match_players")
      .select("player_id")
      .eq("match_id", match_id)
      .eq("player_id", user.id)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Player not in this match" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validação de timeout
    const roundStart = new Date(match.round_started_at).getTime();
    const elapsed = (Date.now() - roundStart) / 1000;

    if (elapsed > ROUND_DURATION_SECONDS) {
      return new Response(JSON.stringify({ error: "Time expired for this round", accepted: false }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotência: rejeita resposta duplicada silenciosamente
    const { data: existing } = await supabaseAdmin
      .from("answers")
      .select("id")
      .eq("match_id", match_id)
      .eq("player_id", user.id)
      .eq("round", match.current_round)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ accepted: false, reason: "already_answered" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // correct_index via service_role — NUNCA sai para o cliente
    const currentQuestionId = match.question_ids[match.current_round - 1];
    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("id, correct_index")
      .eq("id", currentQuestionId)
      .single();

    const isCorrect = question?.correct_index === answer_index;

    await supabaseAdmin.from("answers").insert({
      match_id,
      player_id: user.id,
      question_id: currentQuestionId,
      round: match.current_round,
      answer_index,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      await supabaseAdmin.rpc("increment_score", {
        p_match_id: match_id,
        p_player_id: user.id,
      });
    }

    // Retorna apenas confirmação — resultado chega via broadcast em round_ended
    return new Response(JSON.stringify({ accepted: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 6.4 Deploy

```bash
supabase functions deploy submit-answer
```

---

### 📋 Resumo da Fase 6

**O que foi feito:** Edge Function `submit-answer` criada, função SQL `increment_score` criada.

**Contrato:**
```
POST /functions/v1/submit-answer
Body:   { "match_id": "uuid", "answer_index": 1 }
Return: { "accepted": true }
        { "accepted": false, "reason": "already_answered" }
        { "error": "Time expired", "accepted": false }
```

**Garantia de segurança:** `correct_index` nunca sai do servidor nesta chamada. O resultado chega apenas no broadcast `round_ended`.

**Próxima fase:** Edge Function `advance-round` — orquestra fim de rodada, ranking e próxima pergunta.

---

---

<a name="fase-7"></a>
## Fase 7 — Edge Function: `advance-round`

### Contexto
Função orquestradora central. Chamada pelo servidor após os 10s de cada rodada. Sequência: revela `correct_index` → monta ranking → broadcast `round_ended` → aguarda 4s → abre próxima rodada ou finaliza partida.

Protegida por `x-internal-secret` — não é uma rota pública.

> ⚠️ **Limite de tempo:** 10 rodadas × 14s = 140s. Edge Functions têm timeout ~150s. Para partidas maiores, use o Cron Job como mecanismo principal.

**Pré-requisitos:** Fases 2-6 concluídas. Secret configurado: `supabase secrets set INTERNAL_SECRET=valor`.

### 7.1 Criar a função

```bash
supabase functions new advance-round
```

### 7.2 Configurar secret

```bash
supabase secrets set INTERNAL_SECRET=gere-uma-string-aleatoria-longa-aqui
```

### 7.3 Código — `supabase/functions/advance-round/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RANKING_DISPLAY_MS = 4000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Proteção: apenas chamadas internas autorizadas
    const secret = req.headers.get("x-internal-secret");
    if (secret !== Deno.env.get("INTERNAL_SECRET")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { match_id } = await req.json();
    if (!match_id) {
      return new Response(JSON.stringify({ error: "match_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .eq("status", "in_progress")
      .single();

    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found or not in progress" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentRound = match.current_round;
    const currentQuestionId = match.question_ids[currentRound - 1];

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("id, correct_index")
      .eq("id", currentQuestionId)
      .single();

    const { data: players } = await supabaseAdmin
      .from("match_players")
      .select("player_id, score, status, players(name)")
      .eq("match_id", match_id)
      .order("score", { ascending: false });

    const scores = (players ?? []).map((p: any) => ({
      player_id: p.player_id,
      name: p.players?.name ?? "?",
      score: p.score,
      status: p.status,
    }));

    const channel = supabaseAdmin.channel(`match:${match_id}`);
    await channel.subscribe();

    // Broadcast: revela resultado da rodada
    await channel.send({
      type: "broadcast",
      event: "round_ended",
      payload: {
        round: currentRound,
        correct_index: question?.correct_index,
        scores,
      },
    });

    await sleep(RANKING_DISPLAY_MS);

    const isLastRound = currentRound >= match.total_rounds;

    if (isLastRound) {
      await supabaseAdmin
        .from("matches")
        .update({ status: "finished" })
        .eq("id", match_id);

      const maxScore = Math.max(...scores.map((s: any) => s.score));
      const finalScores = scores.map((s: any) => ({
        ...s,
        winner: s.score === maxScore,
      }));

      await channel.send({
        type: "broadcast",
        event: "match_finished",
        payload: { final_scores: finalScores },
      });

      return new Response(JSON.stringify({ status: "finished" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      const nextRound = currentRound + 1;
      const nextQuestionId = match.question_ids[nextRound - 1];
      const roundStartedAt = new Date().toISOString();

      await supabaseAdmin
        .from("matches")
        .update({ current_round: nextRound, round_started_at: roundStartedAt })
        .eq("id", match_id);

      const { data: nextQuestion } = await supabaseAdmin
        .from("questions")
        .select("id, text, options")  // ← sem correct_index
        .eq("id", nextQuestionId)
        .single();

      await channel.send({
        type: "broadcast",
        event: "round_started",
        payload: {
          round: nextRound,
          total_rounds: match.total_rounds,
          question: nextQuestion,
          started_at: roundStartedAt,
          duration_seconds: 10,
        },
      });

      return new Response(JSON.stringify({ status: "next_round", round: nextRound }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### 7.4 Cron Job de recuperação (Interface Web > Database > Extensions)

1. Habilite a extensão **pg_cron** em Database > Extensions
2. Execute no SQL Editor:

```sql
-- Recuperação de rodadas travadas (fallback — granularidade mínima: 1 minuto)
SELECT cron.schedule(
  'advance-stuck-matches',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/advance-round',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.internal_secret')
      ),
      body := jsonb_build_object('match_id', id)
    )
  FROM public.matches
  WHERE status = 'in_progress'
    AND round_started_at < now() - interval '12 seconds';
  $$
);
```

### 7.5 Deploy

```bash
supabase functions deploy advance-round
```

---

### 📋 Resumo da Fase 7

**O que foi feito:** Edge Function `advance-round` criada, secret configurado, cron de recuperação ativo.

**Eventos broadcast gerados:**
```
round_ended     → correct_index revelado + ranking parcial
round_started   → próxima pergunta (sem correct_index)
match_finished  → ranking final com campo winner
```

**Próxima fase:** Seed de 75 perguntas (15 por tema) para popular o banco.

---

---

<a name="fase-8"></a>
## Fase 8 — Seed de Perguntas

### Contexto
Mínimo necessário: 10 perguntas por tema. O seed abaixo insere 15 por tema (75 total) para dar margem de aleatoriedade no sorteio.

### 8.1 Executar no SQL Editor

```sql
INSERT INTO public.questions (theme, text, options, correct_index) VALUES

-- TECNOLOGIA
('tecnologia', 'Qual linguagem de programação foi criada pela Mozilla Foundation?', '["Go","Rust","Kotlin"]', 1),
('tecnologia', 'O que significa a sigla HTTP?', '["HyperText Transfer Protocol","High Transfer Text Process","Hybrid Text Transmission Protocol"]', 0),
('tecnologia', 'Qual empresa criou o sistema operacional Android?', '["Apple","Microsoft","Google"]', 2),
('tecnologia', 'O que é um endereço IP?', '["Um tipo de processador","Um identificador numérico de dispositivo em rede","Um protocolo de segurança"]', 1),
('tecnologia', 'Qual linguagem é principal no desenvolvimento web front-end?', '["Python","JavaScript","C++"]', 1),
('tecnologia', 'O que significa CPU?', '["Central Processing Unit","Computer Power Unit","Core Program Utility"]', 0),
('tecnologia', 'Qual empresa desenvolveu o sistema iOS?', '["Samsung","Apple","Sony"]', 1),
('tecnologia', 'O que é open source?', '["Software pago com suporte","Software com código-fonte aberto","Software exclusivo para empresas"]', 1),
('tecnologia', 'Qual é o banco de dados relacional mais usado no mundo?', '["MongoDB","MySQL","Redis"]', 1),
('tecnologia', 'O que faz um firewall?', '["Aumenta a velocidade da internet","Controla o tráfego de rede","Comprime arquivos"]', 1),
('tecnologia', 'Qual foi o primeiro computador pessoal comercialmente bem-sucedido?', '["IBM PC","Apple II","Altair 8800"]', 1),
('tecnologia', 'O que é machine learning?', '["Um tipo de hardware","Aprendizado de máquina baseado em dados","Um antivírus avançado"]', 1),
('tecnologia', 'Qual protocolo é usado para envio de emails?', '["FTP","SMTP","SSH"]', 1),
('tecnologia', 'O que significa RAM?', '["Read Access Memory","Random Access Memory","Rapid Array Module"]', 1),
('tecnologia', 'Qual fundação criou o Git?', '["Microsoft","Linux Foundation","Google"]', 1),

-- HISTORIA
('historia', 'Em que ano o Brasil proclamou sua independência?', '["1888","1822","1889"]', 1),
('historia', 'Quem foi o primeiro presidente dos Estados Unidos?', '["Abraham Lincoln","Thomas Jefferson","George Washington"]', 2),
('historia', 'Em que ano começou a Segunda Guerra Mundial?', '["1939","1941","1935"]', 0),
('historia', 'Qual civilização construiu o Coliseu?', '["Grega","Romana","Egípcia"]', 1),
('historia', 'A Revolução Francesa ocorreu em qual ano?', '["1776","1789","1804"]', 1),
('historia', 'Quem foi Napoleão Bonaparte?', '["Rei da Espanha","Imperador francês","General prussiano"]', 1),
('historia', 'Em que ano o homem pisou na Lua pela primeira vez?', '["1965","1969","1972"]', 1),
('historia', 'Qual país foi o primeiro a conceder direito de voto às mulheres?', '["França","Nova Zelândia","Brasil"]', 1),
('historia', 'O que foi a Inquisição?', '["Uma guerra medieval","Um tribunal da Igreja Católica","Um movimento artístico"]', 1),
('historia', 'Qual foi o maior império da história em extensão territorial?', '["Romano","Britânico","Mongol"]', 2),
('historia', 'Em que país ocorreu a Revolução Bolchevique?', '["China","Alemanha","Rússia"]', 2),
('historia', 'Em que ano caiu o Muro de Berlim?', '["1985","1989","1991"]', 1),
('historia', 'Em que século ocorreu a Revolução Industrial?', '["XVII","XVIII","XIX"]', 1),
('historia', 'Quem escreveu a Declaração de Independência dos EUA?', '["Benjamin Franklin","George Washington","Thomas Jefferson"]', 2),
('historia', 'Em que continente surgiu a escrita cuneiforme?', '["África","Ásia","Europa"]', 1),

-- ESPORTES
('esportes', 'Quantos jogadores compõem um time de futebol em campo?', '["9","10","11"]', 2),
('esportes', 'Em que país foi realizada a Copa do Mundo de 2014?', '["Argentina","Brasil","Alemanha"]', 1),
('esportes', 'Qual esporte é jogado no Wimbledon?', '["Golf","Tênis","Cricket"]', 1),
('esportes', 'Quantos sets são necessários para vencer no tênis em Grand Slams masculinos?', '["2","3","5"]', 1),
('esportes', 'O que é um hat-trick no futebol?', '["Dois gols no mesmo jogo","Três gols no mesmo jogo","Gol de cabeça"]', 1),
('esportes', 'Qual esporte usa um volante (shuttlecock)?', '["Squash","Badminton","Tênis de mesa"]', 1),
('esportes', 'Em que esporte existe a posição de quarterback?', '["Rugby","Futebol americano","Beisebol"]', 1),
('esportes', 'Quantos pontos vale uma cesta de 3 no basquete?', '["2","3","4"]', 1),
('esportes', 'Quem foi considerado o melhor jogador da Copa do Mundo de 2022?', '["Mbappé","Modric","Messi"]', 2),
('esportes', 'Em que distância é disputada a corrida de 100m rasos?', '["80m","100m","110m"]', 1),
('esportes', 'Quantos jogadores compõem um time de vôlei em quadra?', '["5","6","7"]', 1),
('esportes', 'Qual é o esporte mais praticado no mundo?', '["Basquete","Futebol","Natação"]', 1),
('esportes', 'Quantas rodadas tem um boxe profissional padrão?', '["10","12","15"]', 1),
('esportes', 'Em que país nasceu o esporte rugby?', '["França","Austrália","Inglaterra"]', 2),
('esportes', 'Qual é a distância oficial de uma maratona?', '["40km","42,195km","45km"]', 1),

-- FILMES
('filmes', 'Quem dirigiu o filme Jurassic Park?', '["James Cameron","Steven Spielberg","George Lucas"]', 1),
('filmes', 'Qual ator interpreta Tony Stark?', '["Chris Evans","Robert Downey Jr.","Mark Ruffalo"]', 1),
('filmes', 'Qual é o nome do boneco de pano em Toy Story?', '["Buzz","Woody","Rex"]', 1),
('filmes', 'Em que ano foi lançado Titanic de James Cameron?', '["1995","1997","1999"]', 1),
('filmes', 'Qual diretor é conhecido pela trilogia O Senhor dos Anéis?', '["Ridley Scott","Christopher Nolan","Peter Jackson"]', 2),
('filmes', 'Qual ator ganhou o Oscar de Melhor Ator por Coringa de 2019?', '["Robert De Niro","Joaquin Phoenix","Heath Ledger"]', 1),
('filmes', 'Qual personagem diz a frase Eu sou seu pai em Star Wars?', '["Obi-Wan Kenobi","Darth Vader","Yoda"]', 1),
('filmes', 'Qual estúdio produziu os filmes do Universo Marvel (MCU)?', '["Warner Bros","Disney/Marvel Studios","Universal"]', 1),
('filmes', 'Em qual filme aparece o personagem Hannibal Lecter?', '["Seven","O Silêncio dos Inocentes","Psicose"]', 1),
('filmes', 'Quem escreveu o roteiro original de Star Wars (1977)?', '["Steven Spielberg","George Lucas","Francis Ford Coppola"]', 1),
('filmes', 'Qual foi o primeiro longa-metragem animado da Disney?', '["Cinderela","Bambi","Branca de Neve"]', 2),
('filmes', 'Em que cidade se passa Blade Runner?', '["Nova York","Los Angeles","Tokyo"]', 1),
('filmes', 'Qual filme ganhou o Oscar de Melhor Filme em 2020?', '["1917","Coringa","Parasita"]', 2),
('filmes', 'Quem dirigiu Pulp Fiction?', '["Martin Scorsese","Quentin Tarantino","David Fincher"]', 1),
('filmes', 'Qual ator interpretou o Coringa em Batman (1989)?', '["Heath Ledger","Jack Nicholson","Jared Leto"]', 1),

-- GERAL
('geral', 'Qual é o maior oceano do mundo?', '["Atlântico","Índico","Pacífico"]', 2),
('geral', 'Quantos planetas existem no Sistema Solar?', '["7","8","9"]', 1),
('geral', 'Qual é o elemento químico mais abundante no universo?', '["Oxigênio","Hidrogênio","Carbono"]', 1),
('geral', 'Em que continente fica o Egito?', '["Ásia","África","Oriente Médio"]', 1),
('geral', 'Qual é o animal terrestre mais rápido?', '["Leão","Guepardo","Cavalo"]', 1),
('geral', 'Quantos ossos tem o corpo humano adulto?', '["196","206","216"]', 1),
('geral', 'Qual é a capital da Austrália?', '["Sydney","Melbourne","Canberra"]', 2),
('geral', 'Qual é o rio mais longo do mundo?', '["Amazonas","Congo","Nilo"]', 2),
('geral', 'A que velocidade viaja a luz?', '["150.000 km/s","300.000 km/s","450.000 km/s"]', 1),
('geral', 'Qual é o menor país do mundo?', '["Monaco","San Marino","Vaticano"]', 2),
('geral', 'Quantos continentes existem?', '["5","6","7"]', 2),
('geral', 'Qual gás as plantas absorvem durante a fotossíntese?', '["Oxigênio","Nitrogênio","Dióxido de carbono"]', 2),
('geral', 'Qual é o metal mais leve?', '["Alumínio","Lítio","Magnésio"]', 1),
('geral', 'Em que país fica a Torre Eiffel?', '["Itália","França","Bélgica"]', 1),
('geral', 'Qual é o instrumento de corda mais grave da orquestra?', '["Viola","Violoncelo","Contrabaixo"]', 2);
```

### 8.2 Verificar seed

```sql
SELECT theme, count(*) AS total
FROM public.questions
GROUP BY theme
ORDER BY theme;
-- Esperado: 15 por tema, 75 total
```

---

### 📋 Resumo da Fase 8

**O que foi feito:** 75 perguntas inseridas (15 por tema: tecnologia, historia, esportes, filmes, geral).

**Estado do banco:**
```
questions → 75 registros
```

**Próxima fase:** Testes e validação de toda a infraestrutura.

---

---

<a name="fase-9"></a>
## Fase 9 — Testes e Validação

### Contexto
Validação completa antes de conectar o frontend. Cobre: segurança do `correct_index`, fluxo completo de partida e integridade dos dados.

### 9.1 Teste de segurança (SQL Editor)

```sql
-- DEVE retornar erro de permissão (correct_index bloqueado)
SELECT correct_index FROM public.questions LIMIT 1;

-- DEVE funcionar (view segura)
SELECT * FROM public.questions_public LIMIT 1;

-- DEVE retornar apenas: id, theme, text, options
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'questions_public';
```

### 9.2 Teste de fluxo completo (curl)

```bash
export PROJECT_REF=seu_project_ref
export ANON_KEY=sua_anon_key

# 1. Sessão anônima
ACCESS_TOKEN=$(curl -s -X POST \
  https://$PROJECT_REF.supabase.co/auth/v1/signup \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.access_token')

echo "Token: $ACCESS_TOKEN"

# 2. Entrar em partida
curl -s -X POST \
  https://$PROJECT_REF.supabase.co/functions/v1/join-match \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme": "tecnologia"}' | jq .

# 3. Iniciar partida (substitua MATCH_ID)
curl -s -X POST \
  https://$PROJECT_REF.supabase.co/functions/v1/start-match \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "MATCH_ID"}' | jq .

# 4. Enviar resposta
curl -s -X POST \
  https://$PROJECT_REF.supabase.co/functions/v1/submit-answer \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "MATCH_ID", "answer_index": 1}' | jq .
```

### 9.3 Checklist de integridade (SQL Editor)

```sql
-- Respostas registradas corretamente
SELECT a.round, a.answer_index, a.is_correct, q.correct_index
FROM public.answers a
JOIN public.questions q ON a.question_id = q.id
ORDER BY a.round;

-- Score atualizado corretamente
SELECT mp.player_id, p.name, mp.score
FROM public.match_players mp
JOIN public.players p ON mp.player_id = p.id
ORDER BY mp.score DESC;

-- Estado da partida
SELECT id, status, current_round, total_rounds
FROM public.matches
ORDER BY created_at DESC LIMIT 1;
```

### 9.4 Limpeza de dados de teste

```sql
DELETE FROM public.matches
WHERE created_at < now() - interval '1 hour';
```

---

### 📋 Resumo Final — Infraestrutura Completa

```
Supabase Project
├── Auth
│   └── Anonymous sign-ins: ATIVO
│
├── Database (PostgreSQL)
│   ├── players           (RLS ativo)
│   ├── questions         (RLS ativo | correct_index bloqueado via REVOKE)
│   ├── questions_public  (view segura — expõe apenas id, theme, text, options)
│   ├── matches           (RLS ativo)
│   ├── match_players     (RLS ativo)
│   ├── answers           (RLS ativo | sem INSERT direto pelo cliente)
│   └── increment_score() (função SQL auxiliar — SECURITY DEFINER)
│
├── Edge Functions
│   ├── join-match      → busca/cria partida e adiciona jogador
│   ├── start-match     → inicia rodadas + primeiro broadcast
│   ├── submit-answer   → valida e registra resposta (sem vazar correct_index)
│   └── advance-round   → orquestra fim/início de rodada (protegida por secret)
│
├── Realtime (canal: match:{uuid})
│   ├── round_started    → pergunta sem correct_index + timer
│   ├── round_ended      → correct_index revelado + ranking parcial
│   ├── match_finished   → ranking final + campo winner
│   └── match_cancelled  → host desconectou antes de iniciar (reason: host_disconnected)
│
└── Cron Jobs
    └── advance-stuck-matches (recuperação de rodadas travadas — a cada 1 min)
```

**O que o frontend precisará fazer:**
1. `supabase.auth.signInAnonymously()` → cria sessão
2. Criar registro em `players` com nome escolhido
3. Chamar `join-match` → recebe `match_id` e `is_host`
4. Assinar canal Realtime `match:{match_id}`
5. Escutar: `round_started`, `round_ended`, `match_finished`, `match_cancelled`
6. Se `is_host === true`: exibir botão "Iniciar partida" e chamar `start-match`
7. Se `is_host === false`: exibir "Aguardando o host iniciar..."
8. Se receber `match_cancelled`: redirecionar todos para tela inicial com mensagem de erro
9. Enviar respostas via `submit-answer`

---

## 🤖 Prompts Prontos por Fase

### Prompt — Fase 2 (Schema)
```
Você é um engenheiro de banco de dados trabalhando com Supabase/PostgreSQL.
Crie as seguintes tabelas: players, questions, matches, match_players, answers.
Regras: use gen_random_uuid() para PKs, TIMESTAMPTZ para datas, JSONB para arrays.
O campo correct_index em questions é sensível — será bloqueado por RLS na próxima etapa.
Adicione CHECK constraints em campos com valores enumerados.
Crie índices para: busca de partidas por status+tema, ranking por partida, respostas por rodada.
```

### Prompt — Fase 3 (RLS)
```
Você está configurando Row Level Security no Supabase para um quiz multiplayer.
Regra crítica: correct_index em questions NUNCA deve ser acessível pelo cliente autenticado.
Crie uma view questions_public expondo apenas id, theme, text, options.
Revogue SELECT direto em questions para authenticated; conceda SELECT apenas em questions_public.
Jogadores acessam apenas dados de partidas em que participam.
Nenhum INSERT direto em answers — apenas Edge Functions com service_role podem inserir.
```

### Prompt — Fases 4 a 7 (Edge Functions)
```
Você está implementando Edge Functions no Supabase (Deno/TypeScript) para um quiz multiplayer.
Stack: Supabase JS v2, Deno, TypeScript.

Contexto do sistema:
- 5 tabelas: players, questions, matches, match_players, answers
- matches.host_id = jogador que criou a partida (UUID)
- matches.status: 'lobby' | 'in_progress' | 'finished' | 'cancelled'
- Partidas têm 3-8 jogadores, 10 rodadas, 10s por rodada
- Canal Realtime: match:{match_id}
  Eventos: round_started, round_ended, match_finished, match_cancelled

Regras de host:
- Host = jogador cujo player_id === matches.host_id
- Apenas o host pode chamar start-match (outros recebem 403)
- Se host estiver disconnected ao chamar start-match: cancela partida,
  atualiza status para 'cancelled' e faz broadcast de match_cancelled
- join-match retorna is_host: true/false para o frontend saber se exibe o botão iniciar

Regras de segurança obrigatórias:
1. correct_index NUNCA é enviado ao cliente — apenas revelado no broadcast round_ended
2. Respostas duplicadas são rejeitadas silenciosamente (idempotência)
3. Timer de 10s é validado no servidor via round_started_at, não no cliente
4. advance-round é protegida por header x-internal-secret

Use service_role para: ler correct_index, inserir answers, atualizar scores, fazer broadcast.
Use anon key apenas para: autenticar o usuário via getUser().
```
