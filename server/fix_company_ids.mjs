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
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const ATOMI_ID = 3

// Atualiza todas as tabelas filhas para company_id = 3 (Atomi)
const tables = ['clients', 'sellers', 'status', 'catalogs']
for (const table of tables) {
  const { rowCount } = await pool.query(`UPDATE ${table} SET company_id = $1 WHERE company_id IS NULL`, [ATOMI_ID])
  console.log(`${table}: ${rowCount} registros atualizados`)
}

// Confirma resultado
for (const table of tables) {
  const { rows } = await pool.query(`SELECT company_id, COUNT(*) as total FROM ${table} GROUP BY company_id ORDER BY company_id`)
  console.log(`\n${table} por company_id:`, rows.map(r => `id=${r.company_id} total=${r.total}`).join(', ') || '(vazio)')
}

await pool.end()
console.log('\nPronto.')
