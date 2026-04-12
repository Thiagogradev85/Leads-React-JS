-- ================================================================
-- Multi-tenant: tabela de usuários e isolamento de dados por user_id
-- ================================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  nome          VARCHAR(200) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  ativo         BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Adiciona user_id nas tabelas principais (nullable para compatibilidade com dados existentes)
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE sellers  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE status   ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
