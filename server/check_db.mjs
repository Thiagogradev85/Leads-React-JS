import pg from 'pg'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dir = dirname(fileURLToPath(import.meta.url))
const envText = await readFile(join(__dir, '.env'), 'utf8').catch(() => '')
for (const line of envText.split('\n')) {
  const [k, ...rest] = line.trim().split('=')
  if (k && rest.length && !process.env[k]) process.env[k] = rest.join('=').replace(/^["']|["']$/g, '')
}
// Mostra host da conexão (sem senha)
const url = process.env.DATABASE_URL || ''
const masked = url.replace(/:([^:@]+)@/, ':***@')
console.log('DATABASE_URL:', masked)

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const { rows } = await pool.query('SELECT COUNT(*) as total FROM clients')
console.log('Total de clientes:', rows[0].total)
const { rows: r2 } = await pool.query('SELECT COUNT(*) as total FROM users')
console.log('Total de usuários:', r2[0].total)
await pool.end()
