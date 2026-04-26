-- ============================================================
-- Migration 6: Resetar schema e recriar tabelas em português
-- O schema anterior usava nomes ingleses (matches, match_players,
-- answers, questions) com RLS baseada em auth. O frontend usa
-- nomes em português (salas, jogadores, respostas_rodada) sem auth.
-- ============================================================

-- ----------------------------------------
-- Remover tabelas antigas (se existirem)
-- ----------------------------------------
DROP TABLE IF EXISTS answers       CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches       CASCADE;
DROP TABLE IF EXISTS questions     CASCADE;
DROP TABLE IF EXISTS players       CASCADE;

DROP FUNCTION IF EXISTS increment_score(UUID, UUID);

-- ----------------------------------------
-- salas
-- ----------------------------------------
CREATE TABLE salas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          TEXT NOT NULL UNIQUE,
  tema            TEXT NOT NULL
                    CHECK (tema IN ('historia','esportes','tecnologia','filmes','geral')),
  total_perguntas INT  NOT NULL DEFAULT 10,
  timer_segundos  INT  NOT NULL DEFAULT 15
                    CHECK (timer_segundos IN (5, 15, 30)),
  estado          TEXT NOT NULL DEFAULT 'lobby'
                    CHECK (estado IN ('lobby','em_andamento','finalizada')),
  host_id         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------
-- jogadores
-- ----------------------------------------
CREATE TABLE jogadores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id    UUID REFERENCES salas(id) ON DELETE CASCADE,
  player_id  TEXT NOT NULL,
  apelido    TEXT NOT NULL,
  pontuacao  INT  NOT NULL DEFAULT 0,
  is_host    BOOLEAN NOT NULL DEFAULT false,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sala_id, player_id)
);

-- ----------------------------------------
-- perguntas
-- ----------------------------------------
CREATE TABLE perguntas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tema           TEXT NOT NULL
                   CHECK (tema IN ('historia','esportes','tecnologia','filmes','geral')),
  texto          TEXT NOT NULL,
  opcoes         JSONB NOT NULL,   -- array de 3 strings
  indice_correto INT  NOT NULL
                   CHECK (indice_correto BETWEEN 0 AND 2)
);

-- ----------------------------------------
-- respostas_rodada
-- ----------------------------------------
CREATE TABLE respostas_rodada (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sala_id        UUID REFERENCES salas(id)     ON DELETE CASCADE,
  player_id      TEXT NOT NULL,
  pergunta_id    UUID REFERENCES perguntas(id) ON DELETE CASCADE,
  rodada         INT  NOT NULL,
  resposta_index INT,           -- NULL = timeout
  is_correct     BOOLEAN,       -- preenchido via trigger
  respondido_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sala_id, player_id, rodada)
);

-- ----------------------------------------
-- Índices de performance
-- ----------------------------------------
CREATE INDEX idx_jogadores_sala_id          ON jogadores (sala_id);
CREATE INDEX idx_respostas_sala_rodada      ON respostas_rodada (sala_id, rodada);
CREATE INDEX idx_perguntas_tema             ON perguntas (tema);
