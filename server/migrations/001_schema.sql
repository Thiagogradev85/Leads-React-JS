-- ================================================================
-- Schema Principal — CRM Leads
-- Execute este arquivo no console do seu banco PostgreSQL (Neon)
-- ================================================================

-- Status do pipeline de vendas
CREATE TABLE IF NOT EXISTS status (
  id      SERIAL PRIMARY KEY,
  nome    VARCHAR(100) NOT NULL,
  cor     VARCHAR(20)  NOT NULL DEFAULT '#6b7280',
  ordem   INT          NOT NULL DEFAULT 0
);

-- Vendedores
CREATE TABLE IF NOT EXISTS sellers (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(200) NOT NULL,
  whatsapp   VARCHAR(30),
  ativo      BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Estados atendidos por cada vendedor (relação N:N)
CREATE TABLE IF NOT EXISTS seller_ufs (
  seller_id INT     NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  uf        CHAR(2) NOT NULL,
  PRIMARY KEY (seller_id, uf)
);

-- Catálogos de produtos
CREATE TABLE IF NOT EXISTS catalogs (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(200) NOT NULL,
  data       DATE,
  ativo      BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Produtos do catálogo (patinetes, scooters etc.)
CREATE TABLE IF NOT EXISTS products (
  id               SERIAL       PRIMARY KEY,
  catalog_id       INT          REFERENCES catalogs(id) ON DELETE CASCADE,
  nome             VARCHAR(200),
  modelo           VARCHAR(200),
  bateria          VARCHAR(100),
  motor            VARCHAR(100),
  pneu             VARCHAR(100),
  suspensao        VARCHAR(100),
  carregador       VARCHAR(100),
  velocidade_min   NUMERIC(8,2),
  velocidade_max   NUMERIC(8,2),
  autonomia        VARCHAR(100),
  impermeabilidade VARCHAR(50),
  peso             VARCHAR(50),
  estoque          INT          NOT NULL DEFAULT 0,
  imagem           VARCHAR(500),
  extra            TEXT,
  preco            NUMERIC(12,2),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Clientes / Leads
CREATE TABLE IF NOT EXISTS clients (
  id             SERIAL       PRIMARY KEY,
  nome           VARCHAR(200) NOT NULL,
  cidade         VARCHAR(200),
  uf             CHAR(2),
  whatsapp       VARCHAR(30),
  site           VARCHAR(300),
  instagram      VARCHAR(200),
  nota           SMALLINT     CHECK (nota BETWEEN 1 AND 3),
  status_id      INT          REFERENCES status(id)   ON DELETE SET NULL,
  catalog_id     INT          REFERENCES catalogs(id) ON DELETE SET NULL,
  seller_id      INT          REFERENCES sellers(id)  ON DELETE SET NULL,
  ativo          BOOLEAN      NOT NULL DEFAULT true,
  ultimo_contato TIMESTAMP,
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Observações / Follow-ups por cliente
CREATE TABLE IF NOT EXISTS observations (
  id         SERIAL    PRIMARY KEY,
  client_id  INT       NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  texto      TEXT      NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Eventos do relatório diário
-- Índice único parcial: contacted/catalog_requested/new_client = 1x por dia
-- purchased não tem restrição (pode ser registrado N vezes/dia)
CREATE TABLE IF NOT EXISTS daily_report_events (
  id         SERIAL      PRIMARY KEY,
  client_id  INT         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_date DATE        NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_report_events_unique_non_purchase
  ON daily_report_events (client_id, event_type, event_date)
  WHERE event_type != 'purchased';

-- ================================================================
-- Status padrão do pipeline (sem duplicar se já existir)
-- ================================================================
INSERT INTO status (nome, cor, ordem) VALUES
  ('Prospecção',        '#6b7280', 1),
  ('Contatado',         '#3b82f6', 2),
  ('Em Negociação',     '#f59e0b', 3),
  ('Proposta Enviada',  '#8b5cf6', 4),
  ('Fechado',           '#10b981', 5),
  ('Perdido',           '#ef4444', 6),
  ('Em Análise',        '#06b6d4', 7),
  ('Follow-up',         '#f97316', 8),
  ('Cliente Ativo',     '#22c55e', 9),
  ('Cliente Inativo',   '#78716c', 10),
  ('Catálogo',          '#ec4899', 11)
ON CONFLICT DO NOTHING;
