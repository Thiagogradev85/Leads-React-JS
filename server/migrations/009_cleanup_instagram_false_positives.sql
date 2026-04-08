-- Migration 009: limpa handles de Instagram claramente inválidos
-- gerados pelo bug do padrão de menção anterior (capturava palavras
-- portuguesas após "instagram", ex: "instagram SIM" → "SIM")
--
-- Regra: zera instagram onde o valor parece uma palavra comum:
--   - Só letras (sem dígito, ponto ou underscore)
--   - Entre 2 e 10 caracteres (descontando @ inicial se houver)
--
-- Handles reais de marcas quase sempre têm número, ponto ou underscore,
-- ou são mais longos. Exemplos preservados: "brando_bikes", "bike2024", "loja.sc"
-- Exemplos removidos: "SIM", "para", "nos", "com", "loja" (se só letras ≤ 10)
--
-- ANTES de executar, rode o SELECT abaixo para revisar o que será zerado:
--
-- SELECT id, nome, instagram FROM clients
-- WHERE instagram IS NOT NULL
--   AND regexp_replace(instagram, '^\@', '') ~* '^[a-záéíóúàâêôãõüç]+$'
--   AND length(regexp_replace(instagram, '^\@', '')) BETWEEN 2 AND 10
-- ORDER BY instagram;

BEGIN;

UPDATE clients
SET instagram = NULL
WHERE instagram IS NOT NULL
  AND regexp_replace(instagram, '^\@', '') ~* '^[a-záéíóúàâêôãõüç]+$'
  AND length(regexp_replace(instagram, '^\@', '')) BETWEEN 2 AND 10;

COMMIT;

-- Verificação pós-limpeza: quantos instagram restaram
SELECT COUNT(*) AS com_instagram FROM clients WHERE instagram IS NOT NULL;
