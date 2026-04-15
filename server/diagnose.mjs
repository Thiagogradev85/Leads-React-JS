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

const { rows: companies } = await pool.query('SELECT id, nome FROM companies ORDER BY id')
console.log('\nEMPRESAS:')
companies.forEach(c => console.log(`  id=${c.id}  nome="${c.nome}"`))

const { rows: users } = await pool.query('SELECT id, nome, email, company_id FROM users ORDER BY id')
console.log('\nUSUARIOS:')
users.forEach(u => console.log(`  id=${u.id}  nome="${u.nome}"  email=${u.email}  company_id=${u.company_id}`))

const { rows: clientCounts } = await pool.query('SELECT company_id, COUNT(*) as total FROM clients GROUP BY company_id ORDER BY company_id')
console.log('\nCLIENTES POR COMPANY_ID:')
clientCounts.forEach(r => console.log(`  company_id=${r.company_id}  total=${r.total}`))

await pool.end()
