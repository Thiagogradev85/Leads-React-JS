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

const { rows } = await pool.query(`
  SELECT table_name, column_name, is_nullable 
  FROM information_schema.columns 
  WHERE table_name IN ('clients','sellers','status') 
    AND column_name IN ('user_id','company_id') 
  ORDER BY table_name, column_name
`)
console.log('Nullable check:')
rows.forEach(r => console.log(`  ${r.table_name}.${r.column_name} nullable=${r.is_nullable}`))

await pool.end()
