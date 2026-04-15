/**
 * Seed do usuário admin na primeira execução.
 * Cria o admin se não existir — usa ADMIN_EMAIL e ADMIN_PASSWORD do .env.
 * Também migra dados existentes (sem user_id) para o admin.
 */
import db           from '../db/db.js'
import { hashPassword } from '../utils/auth.js'

const DEFAULT_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@admin.com'
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'
const DEFAULT_NOME     = process.env.ADMIN_NOME     || 'Administrador'

export async function seedAdmin() {
  try {
    // Verifica se já existe algum admin
    const { rows } = await db.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    )

    let adminId

    if (rows.length === 0) {
      // Cria o admin
      const hash = await hashPassword(DEFAULT_PASSWORD)
      const { rows: created } = await db.query(
        `INSERT INTO users (nome, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         RETURNING id`,
        [DEFAULT_NOME, DEFAULT_EMAIL, hash]
      )
      adminId = created[0].id
      console.log(`[AdminSeed] Admin criado: ${DEFAULT_EMAIL} (id=${adminId})`)
    } else {
      adminId = rows[0].id
    }

    // (migração user_id → company_id concluída na 016_companies.sql — nada a fazer aqui)
  } catch (err) {
    console.warn('[AdminSeed] Aviso:', err.message)
  }
}
