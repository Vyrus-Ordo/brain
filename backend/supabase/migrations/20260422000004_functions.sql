-- ============================================================
-- Migration 4: Funções auxiliares (RPC)
-- ============================================================

-- Incrementa o score de um jogador em uma partida específica.
-- Usada pelo submit-answer via service_role, sem expor UPDATE direto ao cliente.
CREATE OR REPLACE FUNCTION increment_score(p_match_id UUID, p_player_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE match_players
     SET score = score + 1
   WHERE match_id = p_match_id
     AND player_id = p_player_id;
$$;

-- Revogar permissão de execução para roles não privilegiadas
REVOKE EXECUTE ON FUNCTION increment_score(UUID, UUID) FROM anon, authenticated;
