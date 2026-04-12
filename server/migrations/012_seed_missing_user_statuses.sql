-- Garante que todos os usuários que não têm nenhum status recebam os 5 padrões
-- e um cliente de teste. Seguro para rodar múltiplas vezes.

-- 1. Corrige constraint única: de UNIQUE(nome) global → UNIQUE(nome, user_id) por tenant
ALTER TABLE status DROP CONSTRAINT IF EXISTS status_nome_unique;
ALTER TABLE status DROP CONSTRAINT IF EXISTS status_nome_user_unique;
ALTER TABLE status ADD CONSTRAINT status_nome_user_unique UNIQUE (nome, user_id);

-- 2. Insere statuses padrão para usuários que não têm nenhum
INSERT INTO status (nome, cor, ordem, user_id)
SELECT s.nome, s.cor, s.ordem, u.id
FROM users u
CROSS JOIN (VALUES
  ('Prospecção', '#6b7280', 1),
  ('Contatado',  '#3b82f6', 2),
  ('Proposta',   '#f59e0b', 3),
  ('Fechado',    '#22c55e', 4),
  ('Perdido',    '#ef4444', 5)
) AS s(nome, cor, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM status WHERE user_id = u.id
);

-- 3. Insere 1 cliente de teste para usuários que não têm nenhum cliente
INSERT INTO clients (nome, uf, status_id, user_id)
SELECT
  'Loja Exemplo (Teste)' AS nome,
  'SP' AS uf,
  (SELECT id FROM status WHERE user_id = u.id AND nome = 'Prospecção' LIMIT 1) AS status_id,
  u.id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE user_id = u.id
);
