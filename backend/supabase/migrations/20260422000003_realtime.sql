-- ============================================================
-- Migration 3: Habilitar Supabase Realtime
-- ============================================================

-- Adiciona matches e match_players ao publication de Realtime
-- para que clientes possam usar Postgres Changes (INSERT/UPDATE).
-- Broadcast (eventos round_started, round_ended, match_finished)
-- é gerenciado pelas Edge Functions e não requer configuração SQL.

ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_players;
