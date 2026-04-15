import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dir, '.env') })

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

// Tabelas existentes
const { rows: tables } = await pool.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name
`)
console.log('=== TABELAS ===')
tables.forEach(t => console.log(' ', t.table_name))

// Colunas da tabela clients
const { rows: clientCols } = await pool.query(`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'clients' ORDER BY ordinal_position
`)
console.log('\n=== COLUNAS clients ===')
clientCols.forEach(c => console.log(' ', c.column_name, '-', c.data_type))

// Colunas da tabela users
const { rows: userCols } = await pool.query(`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' ORDER BY ordinal_position
`)
console.log('\n=== COLUNAS users ===')
userCols.forEach(c => console.log(' ', c.column_name, '-', c.data_type))

// FK constraints
const { rows: fks } = await pool.query(`
  SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table,
         rc.delete_rule, tc.constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  ORDER BY tc.table_name
`)
console.log('\n=== FOREIGN KEYS ===')
fks.forEach(f => console.log(` ${f.table_name}.${f.column_name} -> ${f.foreign_table} (ON DELETE ${f.delete_rule})`))

// Contagem de clientes
const { rows: counts } = await pool.query('SELECT COUNT(*) FROM clients')
console.log('\n=== CLIENTES NO BANCO:', counts[0].count, '===')

await pool.end()
