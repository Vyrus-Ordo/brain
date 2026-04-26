-- ============================================================
-- Migration 1: Criar tabelas do Quiz Multiplayer
-- ============================================================

-- ----------------------------------------
-- players
-- ----------------------------------------
CREATE TABLE players (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------
-- questions
-- ----------------------------------------
CREATE TABLE questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme         TEXT NOT NULL
                  CHECK (theme IN ('historia','esportes','tecnologia','filmes','geral')),
  text          TEXT NOT NULL,
  options       JSONB NOT NULL,   -- array de strings, máximo 3 itens
  correct_index INT  NOT NULL
                  CHECK (correct_index BETWEEN 0 AND 2)
);

-- ----------------------------------------
-- matches
-- ----------------------------------------
CREATE TABLE matches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme            TEXT NOT NULL
                     CHECK (theme IN ('historia','esportes','tecnologia','filmes','geral')),
  status           TEXT NOT NULL DEFAULT 'lobby'
                     CHECK (status IN ('lobby','in_progress','finished')),
  current_round    INT  NOT NULL DEFAULT 0,
  total_rounds     INT  NOT NULL DEFAULT 10,
  question_ids     UUID[] NOT NULL,
  round_started_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------
-- match_players
-- ----------------------------------------
CREATE TABLE match_players (
  match_id   UUID REFERENCES matches(id)  ON DELETE CASCADE,
  player_id  UUID REFERENCES players(id)  ON DELETE CASCADE,
  score      INT  NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','disconnected')),
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);

-- ----------------------------------------
-- answers
-- ----------------------------------------
CREATE TABLE answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID REFERENCES matches(id)   ON DELETE CASCADE,
  player_id    UUID REFERENCES players(id)   ON DELETE CASCADE,
  question_id  UUID REFERENCES questions(id) ON DELETE CASCADE,
  round        INT NOT NULL,
  answer_index INT,          -- NULL indica timeout / sem resposta
  is_correct   BOOLEAN,
  answered_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (match_id, player_id, round)
);

-- ----------------------------------------
-- Índices de performance
-- ----------------------------------------
CREATE INDEX idx_match_players_match_id ON match_players (match_id);
CREATE INDEX idx_answers_match_id_round ON answers (match_id, round);
CREATE INDEX idx_matches_status_theme   ON matches (status, theme);
