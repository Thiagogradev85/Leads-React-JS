/**
 * Seed batch 2: PR / TO — novos clientes 11/03/2026
 * Execute: cd server && bun run scripts/seed_clientes_batch2.js
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })
import db from '../src/db/db.js'

const SELLER_ID = 2  // Thiago — PR / TO / MT / SE / MS

const CLIENTES = [
  // ── TOCANTINS ────────────────────────────────────────────────────────────
  { nome: 'Forum Bike',              cidade: 'Palmas',    uf: 'TO', whatsapp: null,          instagram: null,                   site: 'http://www.forumbike.com.br/', nota: 2 },
  { nome: 'CiclomiX - Tocantins Bike', cidade: 'Palmas', uf: 'TO', whatsapp: '6332242111',  instagram: null,                   site: 'https://ciclomix.com/',        nota: 2 },
  { nome: 'Pedal Forte',             cidade: 'Palmas',    uf: 'TO', whatsapp: null,          instagram: 'pedalfortebikes',       site: null,                           nota: 2 },
  { nome: "Bike Brother",            cidade: 'Palmas',    uf: 'TO', whatsapp: null,          instagram: 'bikebrotherpalmas',    site: null,                           nota: 1 },
  { nome: 'J Bike 122',              cidade: 'Palmas',    uf: 'TO', whatsapp: '63985170929', instagram: null,                   site: null,                           nota: 1 },
  { nome: "Giro Bike's",             cidade: 'Palmas',    uf: 'TO', whatsapp: '63992636599', instagram: null,                   site: null,                           nota: 2 },
  { nome: 'Bicicletas & Companhia',  cidade: 'Gurupi',    uf: 'TO', whatsapp: null,          instagram: 'bicicletaecompanhia',  site: null,                           nota: 1 },

  // ── PARANÁ ───────────────────────────────────────────────────────────────
  { nome: 'BIKE TECH',               cidade: 'Curitiba',  uf: 'PR', whatsapp: '4184186269',  instagram: null,                   site: 'https://www.biketechcuritiba.com.br/', nota: 2 },
  { nome: 'CBS Curitiba Bike Store', cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: null,                   site: 'https://www.curitibabikestore.com.br/', nota: 2 },
  { nome: 'Cicles Langner',          cidade: 'Curitiba',  uf: 'PR', whatsapp: '4187970865',  instagram: 'cicles_langner',        site: null,                           nota: 2 },
  { nome: 'Cantelli Bike Shop',      cidade: 'Curitiba',  uf: 'PR', whatsapp: '4688228385',  instagram: 'cantelli.bikeshop',     site: null,                           nota: 1 },
  { nome: 'Agencia Bicicleta',       cidade: 'Curitiba',  uf: 'PR', whatsapp: '41992076721', instagram: 'agencia_bicicleta',     site: null,                           nota: 1 },
  { nome: 'veloxbikeshop',           cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'veloxbikeshop',         site: null,                           nota: 1 },
  { nome: 'Ciclesradar',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '41998228665', instagram: 'ciclesradar',            site: null,                           nota: 1 },
  { nome: 'Brychtabikes',            cidade: 'Curitiba',  uf: 'PR', whatsapp: '41995531622', instagram: 'brychtabikes',           site: null,                           nota: 1 },
  { nome: 'baronbikes',              cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'baronbikes',             site: 'https://www.baronbikes.com/',  nota: 1 },
  { nome: 'Ciclesjaime',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '4132623707',  instagram: 'ciclesjaime',            site: null,                           nota: 1 },
  { nome: 'Bikeportella',            cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'bikeportella',           site: null,                           nota: 1 },
  { nome: 'Biketripbr',              cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'biketripbr',             site: null,                           nota: 1 },
  { nome: 'Bikecentercuritiba',      cidade: 'Curitiba',  uf: 'PR', whatsapp: '12982159999', instagram: 'bikecentercuritiba',     site: null,                           nota: 1 },
  { nome: 'Pardalbikes',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '41997389245', instagram: 'pardalbikes',            site: null,                           nota: 1 },
  { nome: 'Cicles Gabriel',          cidade: 'Curitiba',  uf: 'PR', whatsapp: '41998610206', instagram: 'cicles_gabriel',         site: null,                           nota: 1 },
  { nome: 'Marechalbikecuritiba',    cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'marechalbikecuritiba',   site: null,                           nota: 1 },
  { nome: 'Bikebrotherscuritiba',    cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'bikebrotherscuritiba',   site: null,                           nota: 1 },
  { nome: 'Bicicletariacultural',    cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'bicicletariacultural',   site: null,                           nota: 1 },
  { nome: 'Extremebikescuritiba',    cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'extremebikescuritiba',   site: null,                           nota: 1 },
  { nome: 'Cr Bikes',                cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'cr_bikes_',              site: null,                           nota: 1 },
  { nome: 'Bikeservicectba',         cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'bikeservicectba',        site: null,                           nota: 1 },
  { nome: 'Ciclescentral',           cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: 'ciclescentral_',         site: null,                           nota: 1 },
  { nome: 'Bikesport Cwb',           cidade: 'Curitiba',  uf: 'PR', whatsapp: null,          instagram: null,                    site: null,                           nota: 1 },
]

let inseridos = 0
let ignorados = 0

for (const c of CLIENTES) {
  const { rows } = await db.query(
    'SELECT id FROM clients WHERE LOWER(TRIM(nome)) = LOWER($1) AND uf = $2',
    [c.nome, c.uf]
  )
  if (rows.length) {
    console.log(`  ⏭  ${c.nome} (${c.uf}) — já existe`)
    ignorados++
    continue
  }
  await db.query(
    `INSERT INTO clients (nome, cidade, uf, whatsapp, instagram, site, nota, seller_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [c.nome, c.cidade, c.uf, c.whatsapp || null, c.instagram || null, c.site || null, c.nota, SELLER_ID]
  )
  console.log(`  ✓  ${c.nome} (${c.cidade}/${c.uf})`)
  inseridos++
}

console.log(`\nConcluído: ${inseridos} inseridos, ${ignorados} ignorados.`)
process.exit(0)
