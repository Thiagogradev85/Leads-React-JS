-- ================================================================
-- Migration 014 — Sessões WhatsApp persistidas no banco
-- ================================================================
-- Armazena os dados de autenticação do Baileys por usuário no
-- PostgreSQL em vez do sistema de arquivos (que é efêmero no Render).
-- Cada usuário tem sua própria sessão isolada.

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_type   VARCHAR(100) NOT NULL,   -- 'creds' | 'pre-key' | 'session' | 'sender-key' | etc.
  key_id     VARCHAR(500) NOT NULL,   -- '' para creds; identificador específico para demais chaves
  data       JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key_type, key_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user
  ON whatsapp_sessions (user_id);
