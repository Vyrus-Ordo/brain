-- ============================================================
-- Migration 9: Trigger para auto-calcular is_correct
-- O frontend insere em respostas_rodada e lê is_correct de volta.
-- Este trigger computa is_correct antes do INSERT consultando
-- perguntas com SECURITY DEFINER (acesso à coluna indice_correto
-- sem expô-la ao cliente anon).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_compute_is_correct()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_indice INT;
BEGIN
  -- Timeout / sem resposta → is_correct = false
  IF NEW.resposta_index IS NULL THEN
    NEW.is_correct := false;
    RETURN NEW;
  END IF;

  SELECT indice_correto
    INTO v_indice
    FROM perguntas
   WHERE id = NEW.pergunta_id;

  NEW.is_correct := (NEW.resposta_index = v_indice);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compute_is_correct
  BEFORE INSERT ON respostas_rodada
  FOR EACH ROW
  EXECUTE FUNCTION fn_compute_is_correct();
