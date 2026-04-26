-- ============================================================
-- Migration 8: Habilitar Supabase Realtime nas novas tabelas
-- ============================================================

-- jogadores: necessário para useRoomPresence (Postgres Changes)
ALTER PUBLICATION supabase_realtime ADD TABLE jogadores;

-- salas: necessário para detectar mudança de estado (lobby → em_andamento)
ALTER PUBLICATION supabase_realtime ADD TABLE salas;
