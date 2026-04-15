-- ================================================================
-- Tabela de backup diário de clientes.
-- Roda automaticamente todo dia às 2:00 BRT (5:00 UTC) via cron no servidor.
-- Mantém os últimos 7 dias. Para recuperar: ver recover_from_backup.mjs
-- ================================================================

CREATE TABLE IF NOT EXISTS clients_backup (
  backup_id      SERIAL       PRIMARY KEY,
  backup_date    DATE         NOT NULL DEFAULT CURRENT_DATE,

  -- Cópia de todas as colunas relevantes de clients
  client_id          INTEGER,
  nome               VARCHAR(300),
  cidade             VARCHAR(200),
  uf                 CHAR(2),
  whatsapp           VARCHAR(50),
  telefone           VARCHAR(50),
  email              VARCHAR(300),
  site               VARCHAR(500),
  instagram          VARCHAR(300),
  facebook           VARCHAR(300),
  twitter            VARCHAR(300),
  linkedin           VARCHAR(300),
  responsavel        VARCHAR(200),
  logradouro         VARCHAR(300),
  numero             VARCHAR(30),
  complemento        VARCHAR(300),
  bairro             VARCHAR(200),
  cep                VARCHAR(10),
  cnpj               VARCHAR(20),
  nota               INTEGER,
  ativo              BOOLEAN,
  ja_cliente         BOOLEAN,
  catalogo_enviado   BOOLEAN,
  nao_tem_interesse  BOOLEAN,
  ultimo_contato     TIMESTAMPTZ,
  interesse_reset_at TIMESTAMPTZ,
  status_id          INTEGER,
  seller_id          INTEGER,
  catalog_id         INTEGER,
  user_id            INTEGER,
  company_id         INTEGER,
  created_at         TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ
);

-- Índice para consultas por data
CREATE INDEX IF NOT EXISTS idx_clients_backup_date ON clients_backup(backup_date);
CREATE INDEX IF NOT EXISTS idx_clients_backup_company ON clients_backup(backup_date, company_id);
