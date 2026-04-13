/**
 * Baileys auth state persistido no PostgreSQL.
 *
 * Substitui useMultiFileAuthState (que usa o filesystem local, efêmero no Render).
 * Cada usuário tem suas chaves isoladas pela coluna user_id.
 *
 * Shape da tabela:
 *   (user_id, key_type, key_id, data JSONB)
 *   key_type = 'creds'          + key_id = ''        → credenciais principais
 *   key_type = 'pre-key'        + key_id = '123'     → chaves de pré-sessão
 *   key_type = 'session'        + key_id = 'jid@...' → estado de sessão por contato
 *   etc.
 */

import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'
import pool from '../../db/db.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function toJson(obj) {
  return JSON.stringify(obj, BufferJSON.replacer)
}

function fromJson(raw) {
  // raw pode vir como objeto JS (JSONB do pg já parseia) ou como string
  if (typeof raw === 'string') return JSON.parse(raw, BufferJSON.reviver)
  // Se já é objeto, serializa e re-parseia para aplicar o reviver do Baileys
  return JSON.parse(JSON.stringify(raw), BufferJSON.reviver)
}

// ── operações no banco ────────────────────────────────────────────────────────

async function dbGet(userId, keyType, keyId) {
  const { rows } = await pool.query(
    `SELECT data FROM whatsapp_sessions
     WHERE user_id = $1 AND key_type = $2 AND key_id = $3`,
    [userId, keyType, keyId],
  )
  return rows.length ? fromJson(rows[0].data) : null
}

async function dbSet(userId, keyType, keyId, value) {
  if (value == null) {
    await pool.query(
      `DELETE FROM whatsapp_sessions
       WHERE user_id = $1 AND key_type = $2 AND key_id = $3`,
      [userId, keyType, keyId],
    )
  } else {
    await pool.query(
      `INSERT INTO whatsapp_sessions (user_id, key_type, key_id, data, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (user_id, key_type, key_id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [userId, keyType, keyId, toJson(value)],
    )
  }
}

// ── auth state factory ────────────────────────────────────────────────────────

/**
 * Cria um auth state Baileys com persistência no banco.
 * Equivalente ao useMultiFileAuthState(), mas usa PostgreSQL.
 *
 * @param {number|string} userId — ID do usuário (isolamento de sessão)
 * @returns {{ state: AuthenticationState, saveCreds: () => Promise<void> }}
 */
export async function useDbAuthState(userId) {
  const uid = String(userId)

  // Carrega as credenciais principais (ou cria novas se não existirem)
  let creds = await dbGet(uid, 'creds', '')
  if (!creds) creds = initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        /**
         * Lê chaves de um tipo para uma lista de IDs.
         * Retorna { [id]: value } para os IDs encontrados.
         */
        get: async (type, ids) => {
          const result = {}
          await Promise.all(
            ids.map(async id => {
              const val = await dbGet(uid, type, String(id))
              if (val != null) result[id] = val
            }),
          )
          return result
        },

        /**
         * Grava/apaga chaves.
         * data = { [type]: { [id]: value | null } }
         */
        set: async (data) => {
          const tasks = []
          for (const [type, entries] of Object.entries(data)) {
            for (const [id, value] of Object.entries(entries)) {
              tasks.push(dbSet(uid, type, String(id), value))
            }
          }
          await Promise.all(tasks)
        },
      },
    },

    /** Persiste as credenciais principais (chamado pelo Baileys em creds.update) */
    saveCreds: async () => {
      await dbSet(uid, 'creds', '', creds)
    },
  }
}

/**
 * Remove todas as chaves de sessão de um usuário do banco.
 * Equivalente a apagar a pasta .whatsapp-session/user_<id>/.
 */
export async function clearDbSession(userId) {
  await pool.query(
    `DELETE FROM whatsapp_sessions WHERE user_id = $1`,
    [String(userId)],
  )
  console.log(`[WhatsApp] Sessão do usuário ${userId} apagada do banco.`)
}
