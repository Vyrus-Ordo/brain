-- ============================================================
-- Migration 5: Corrigir bloqueio de correct_index
-- ============================================================
-- O REVOKE SELECT (correct_index) não é suficiente pois o Supabase
-- concede GRANT SELECT em todas as colunas por padrão via default privileges.
-- A solução correta é revogar o acesso total à tabela e re-conceder
-- apenas as colunas seguras, explicitamente.

-- Revogar acesso total à tabela questions para roles de cliente
REVOKE ALL ON questions FROM anon;
REVOKE ALL ON questions FROM authenticated;

-- Conceder acesso apenas às colunas seguras (sem correct_index)
GRANT SELECT (id, theme, text, options) ON questions TO authenticated;
GRANT SELECT (id, theme, text, options) ON questions TO anon;
