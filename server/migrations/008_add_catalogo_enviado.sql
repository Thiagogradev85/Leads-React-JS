-- Migration 008: adiciona flag catalogo_enviado na tabela clients
-- Persiste o histórico de quem já recebeu catálogo, independente do status atual

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS catalogo_enviado BOOLEAN NOT NULL DEFAULT false;

-- Migra dados existentes: quem tem status "Catálogo" já recebeu
UPDATE clients
SET catalogo_enviado = true
WHERE status_id = (SELECT id FROM status WHERE nome = 'Catálogo' LIMIT 1)
  AND catalogo_enviado = false;

-- Migra dados do histórico: quem teve evento catalog_requested no relatório diário
UPDATE clients
SET catalogo_enviado = true
WHERE id IN (
  SELECT DISTINCT client_id FROM daily_report_events WHERE event_type = 'catalog_requested'
)
AND catalogo_enviado = false;
