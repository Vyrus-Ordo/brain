-- ============================================================
-- Migration 7: Row Level Security — acesso via role anon
-- O app não usa autenticação Supabase (sem login).
-- Todas as operações são feitas com a anon key diretamente.
-- ============================================================

-- ----------------------------------------
-- Habilitar RLS
-- ----------------------------------------
ALTER TABLE salas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogadores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE perguntas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_rodada ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- salas
-- anon pode SELECT (buscar por código) e INSERT (criar sala)
-- anon pode UPDATE estado (host inicia partida)
-- ----------------------------------------
CREATE POLICY "salas_select"
  ON salas FOR SELECT TO anon
  USING (true);

CREATE POLICY "salas_insert"
  ON salas FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "salas_update"
  ON salas FOR UPDATE TO anon
  USING (true);

-- ----------------------------------------
-- jogadores
-- anon pode ver todos da mesma sala, inserir e atualizar pontuação
-- ----------------------------------------
CREATE POLICY "jogadores_select"
  ON jogadores FOR SELECT TO anon
  USING (true);

CREATE POLICY "jogadores_insert"
  ON jogadores FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "jogadores_update"
  ON jogadores FOR UPDATE TO anon
  USING (true);

-- ----------------------------------------
-- perguntas
-- anon pode SELECT mas NÃO pode ver indice_correto
-- ----------------------------------------

-- Revogar acesso total e re-conceder apenas colunas seguras
REVOKE ALL ON perguntas FROM anon;
REVOKE ALL ON perguntas FROM authenticated;

GRANT SELECT (id, tema, texto, opcoes) ON perguntas TO anon;
GRANT SELECT (id, tema, texto, opcoes) ON perguntas TO authenticated;

CREATE POLICY "perguntas_select"
  ON perguntas FOR SELECT TO anon
  USING (true);

-- ----------------------------------------
-- respostas_rodada
-- anon pode INSERT (registrar resposta) e SELECT (ver própria resposta)
-- ----------------------------------------
CREATE POLICY "respostas_select"
  ON respostas_rodada FOR SELECT TO anon
  USING (true);

CREATE POLICY "respostas_insert"
  ON respostas_rodada FOR INSERT TO anon
  WITH CHECK (true);
