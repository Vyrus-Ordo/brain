-- ============================================================
-- Migration 2: Row Level Security (RLS)
-- ============================================================

-- ----------------------------------------
-- Habilitar RLS em todas as tabelas
-- ----------------------------------------
ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers      ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- players
-- Cada jogador lê e atualiza apenas o próprio registro.
-- INSERT é feito pelas Edge Functions via service_role.
-- ----------------------------------------
CREATE POLICY "players_select_own"
  ON players FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------
-- questions
-- Jogadores autenticados podem ler text, theme e options.
-- correct_index é bloqueado via privilege de coluna abaixo.
-- ----------------------------------------
CREATE POLICY "questions_select_authenticated"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Bloquear acesso a correct_index no nível de coluna.
-- Mesmo que a política de linha permita SELECT, a coluna
-- correct_index não estará acessível via REST/GraphQL.
REVOKE SELECT (correct_index) ON questions FROM anon;
REVOKE SELECT (correct_index) ON questions FROM authenticated;

-- ----------------------------------------
-- matches
-- Jogador vê apenas partidas em que participa.
-- ----------------------------------------
CREATE POLICY "matches_select_participant"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM match_players mp
       WHERE mp.match_id = matches.id
         AND mp.player_id = auth.uid()
    )
  );

-- ----------------------------------------
-- match_players
-- Jogador vê apenas seus próprios registros de participação.
-- ----------------------------------------
CREATE POLICY "match_players_select_own"
  ON match_players FOR SELECT
  USING (player_id = auth.uid());

-- ----------------------------------------
-- answers
-- Jogador vê apenas as próprias respostas.
-- ----------------------------------------
CREATE POLICY "answers_select_own"
  ON answers FOR SELECT
  USING (player_id = auth.uid());
