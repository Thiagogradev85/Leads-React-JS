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

// Contagem de todas as tabelas relevantes
const tables = ['users','companies','clients','sellers','status','catalogs','products','settings','user_settings','_migrations']
console.log('Contagens por tabela:')
for (const t of tables) {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*) as n FROM ${t}`)
    console.log(`  ${t}: ${rows[0].n}`)
  } catch(e) {
    console.log(`  ${t}: TABELA NAO EXISTE (${e.message.split('\n')[0]})`)
  }
}

// Checar colunas da tabela clients
const { rows: cols } = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='clients' ORDER BY ordinal_position`)
console.log('\nColunas de clients:', cols.map(c => c.column_name).join(', '))

await pool.end()
