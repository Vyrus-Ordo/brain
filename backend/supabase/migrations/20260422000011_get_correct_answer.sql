-- ============================================================
-- Migration 11: RPC para buscar a resposta correta
-- Necessário para o host revelar a resposta correta no final da rodada
-- ============================================================

CREATE OR REPLACE FUNCTION get_correct_answer(p_pergunta_id UUID)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT indice_correto FROM perguntas WHERE id = p_pergunta_id;
$$;
