/**
 * rollback_today.mjs
 * Desfaz as migrations de 15/04/2026 (016_companies, 017_settings_per_user, 018_clients_backup)
 * Restabelece o schema compatível com as migrations 001–015 (estado de 14/04/2026)
 */
import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dir, '.env') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

console.log('🔄 Iniciando rollback das migrations de hoje (15/04/2026)...\n')

const client = await pool.connect()
try {
  await client.query('BEGIN')

  // 1. Remover company_id de todas as tabelas que o receberam
  //    (DROP COLUMN remove automaticamente qualquer FK constraint associada)
  console.log('1️⃣  Removendo company_id de clients...')
  await client.query('ALTER TABLE clients  DROP COLUMN IF EXISTS company_id')

  console.log('2️⃣  Removendo company_id de sellers...')
  await client.query('ALTER TABLE sellers  DROP COLUMN IF EXISTS company_id')

  console.log('3️⃣  Removendo company_id de status...')
  await client.query('ALTER TABLE status   DROP COLUMN IF EXISTS company_id')

  console.log('4️⃣  Removendo company_id de catalogs...')
  await client.query('ALTER TABLE catalogs DROP COLUMN IF EXISTS company_id')

  console.log('5️⃣  Removendo company_id de users...')
  await client.query('ALTER TABLE users    DROP COLUMN IF EXISTS company_id')

  // 2. Dropar tabelas criadas pelas migrations de hoje
  console.log('6️⃣  Dropando tabela clients_backup...')
  await client.query('DROP TABLE IF EXISTS clients_backup CASCADE')

  console.log('7️⃣  Dropando tabela user_settings...')
  await client.query('DROP TABLE IF EXISTS user_settings CASCADE')

  console.log('8️⃣  Dropando tabela companies...')
  await client.query('DROP TABLE IF EXISTS companies CASCADE')

  // 3. Limpar registro de migrations aplicadas (se existir tabela _migrations)
  const { rows: migTables } = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_name = '_migrations'"
  )
  if (migTables.length > 0) {
    console.log('9️⃣  Limpando registros de _migrations para 016, 017, 018...')
    await client.query(
      "DELETE FROM _migrations WHERE filename LIKE '016%' OR filename LIKE '017%' OR filename LIKE '018%'"
    )
  }

  await client.query('COMMIT')
  console.log('\n✅ Rollback concluído com sucesso!')

  // Verificação final
  const { rows: tables } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  )
  console.log('\n📋 Tabelas restantes:', tables.map(t => t.table_name).join(', '))

  const { rows: cols } = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='clients' AND column_name='company_id'"
  )
  console.log('🔍 company_id em clients:', cols.length === 0 ? 'removida ✓' : '⚠️ ainda existe')

  const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM clients')
  console.log('👥 Clientes no banco:', cnt[0].count)

} catch (err) {
  await client.query('ROLLBACK')
  console.error('\n❌ Erro — rollback desfeito:', err.message)
  process.exit(1)
} finally {
  client.release()
  await pool.end()
}
