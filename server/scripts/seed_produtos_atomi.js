/**
 * Seed: insere produtos Atomi no primeiro catálogo
 * Execute: bun run server/scripts/seed_produtos_atomi.js
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../server/.env') })
config({ path: resolve(__dirname, '../.env') })

import db from '../src/db/db.js'

const PRODUTOS = [
  { tipo: 'patinete',   modelo: 'C1',     velocidade_max: 30, autonomia: '40 km', motor: '650w',        bateria: '36v 7.6ah'  },
  { tipo: 'patinete',   modelo: 'L10',    velocidade_max: 40, autonomia: '50 km', motor: '1000w',       bateria: '48v 12.6ah' },
  { tipo: 'bicicleta',  modelo: 'ZX-161', velocidade_max: 32, autonomia: '40 km', motor: '650w',        bateria: '36v 7.8ah'  },
  { tipo: 'bicicleta',  modelo: 'ZX-201', velocidade_max: 50, autonomia: '80 km', motor: '1000w',       bateria: '48v 13ah'   },
  { tipo: 'bicicleta',  modelo: 'ZX202',  velocidade_max: 50, autonomia: '80 km', motor: '750W-1000W',  bateria: '48V 13Ah'   },
  { tipo: 'bicicleta',  modelo: 'M-201',  velocidade_max: 50, autonomia: '80 km', motor: '1000w',       bateria: '48v 13ah'   },
]

const { rows: cats } = await db.query('SELECT id, nome FROM catalogs ORDER BY id LIMIT 1')
if (!cats.length) {
  console.error('Nenhum catálogo encontrado. Crie um catálogo primeiro.')
  process.exit(1)
}
const catId = cats[0].id
console.log(`Inserindo produtos no catálogo "${cats[0].nome}" (id=${catId})...`)

let inseridos = 0
let ignorados = 0

for (const p of PRODUTOS) {
  const { rows: exists } = await db.query(
    'SELECT id FROM products WHERE catalog_id = $1 AND modelo = $2',
    [catId, p.modelo]
  )
  if (exists.length) {
    console.log(`  ⏭  ${p.tipo} ${p.modelo} — já existe, ignorado`)
    ignorados++
    continue
  }
  await db.query(
    `INSERT INTO products (catalog_id, tipo, modelo, velocidade_max, autonomia, motor, bateria, estoque)
     VALUES ($1,$2,$3,$4,$5,$6,$7,0)`,
    [catId, p.tipo, p.modelo, p.velocidade_max, p.autonomia, p.motor, p.bateria]
  )
  console.log(`  ✓  ${p.tipo} ${p.modelo}`)
  inseridos++
}

console.log(`\nConcluído: ${inseridos} inseridos, ${ignorados} ignorados.`)
process.exit(0)
