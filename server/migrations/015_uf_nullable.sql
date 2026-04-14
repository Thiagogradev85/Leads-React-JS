-- Torna a coluna uf opcional para permitir importação de clientes sem estado informado
ALTER TABLE clients ALTER COLUMN uf DROP NOT NULL;
