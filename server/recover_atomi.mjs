/**
 * recover_atomi.mjs — Recria sellers, statuses e clientes para Atomi (company_id=3)
 * Uso: node recover_atomi.mjs
 */
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

const COMPANY_ID = 3
const USER_ID_THIAGO  = 1
const USER_ID_SCARLETT = 2

// ── 1. Statuses padrão para Atomi ────────────────────────────────────────────
console.log('\n▶ Criando statuses...')
const STATUSES = [
  { nome: 'Prospecção', cor: '#6b7280', ordem: 1 },
  { nome: 'Contatado',  cor: '#3b82f6', ordem: 2 },
  { nome: 'Proposta',   cor: '#f59e0b', ordem: 3 },
  { nome: 'Fechado',    cor: '#22c55e', ordem: 4 },
  { nome: 'Perdido',    cor: '#ef4444', ordem: 5 },
]

for (const s of STATUSES) {
  const exists = await pool.query(
    'SELECT 1 FROM status WHERE LOWER(nome)=$1 AND company_id=$2 LIMIT 1',
    [s.nome.toLowerCase(), COMPANY_ID]
  )
  if (exists.rows.length) { console.log(`  ⏭  status "${s.nome}" — já existe`); continue }
  await pool.query(
    'INSERT INTO status (nome, cor, ordem, user_id, company_id) VALUES ($1,$2,$3,$4,$5)',
    [s.nome, s.cor, s.ordem, USER_ID_THIAGO, COMPANY_ID]
  )
  console.log(`  ✅  status "${s.nome}" criado`)
}

// ── 2. Seller Thiago ──────────────────────────────────────────────────────────
console.log('\n▶ Criando seller Thiago...')
let sellerId
const existSeller = await pool.query(
  "SELECT id FROM sellers WHERE LOWER(nome)='thiago' AND company_id=$1 LIMIT 1",
  [COMPANY_ID]
)
if (existSeller.rows.length) {
  sellerId = existSeller.rows[0].id
  console.log(`  ⏭  Seller Thiago já existe (id=${sellerId})`)
} else {
  const { rows } = await pool.query(
    'INSERT INTO sellers (nome, company_id, user_id) VALUES ($1,$2,$3) RETURNING id',
    ['Thiago', COMPANY_ID, USER_ID_THIAGO]
  )
  sellerId = rows[0].id
  console.log(`  ✅  Seller Thiago criado (id=${sellerId})`)
}

// UFs do Thiago
const UFS = ['MS','PR','MT','TO','SE']
for (const uf of UFS) {
  await pool.query(
    'INSERT INTO seller_ufs (seller_id, uf) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [sellerId, uf]
  )
}
console.log(`  ✅  UFs: ${UFS.join(', ')}`)

// Status "Contatado" id
const { rows: stRows } = await pool.query(
  "SELECT id FROM status WHERE LOWER(nome)='contatado' AND company_id=$1 LIMIT 1",
  [COMPANY_ID]
)
const statusContatadoId = stRows[0]?.id
console.log(`  ℹ️   status Contatado id=${statusContatadoId}`)

// ── 3. Clientes ───────────────────────────────────────────────────────────────
async function insertClient(c) {
  const exists = await pool.query(
    'SELECT 1 FROM clients WHERE LOWER(TRIM(nome))=LOWER($1) AND uf=$2 LIMIT 1',
    [c.nome, c.uf]
  )
  if (exists.rows.length) return false
  await pool.query(
    `INSERT INTO clients
       (nome, cidade, uf, whatsapp, instagram, site, nota, status_id, seller_id, user_id, company_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      c.nome, c.cidade ?? null, c.uf,
      c.whatsapp ?? null, c.instagram ?? null, c.site ?? null,
      c.nota ?? 1, statusContatadoId, sellerId,
      USER_ID_THIAGO, COMPANY_ID,
    ]
  )
  return true
}

// ── MS / PR originais (insert_clientes_ms_pr.sql convertido) ─────────────────
console.log('\n▶ Inserindo clientes MS/PR (seed original)...')
const CLIENTES_MS_PR = [
  { nome: 'santanabikeshopms',   cidade: 'Campo Grande', uf: 'MS', whatsapp: '6730268643',  site: 'https://www.santanabikeshop.com.br/', nota: 2 },
  { nome: 'ciclotonims',         cidade: 'Campo Grande', uf: 'MS', nota: 1 },
  { nome: 'Gilmar Bicicletas',   cidade: 'Campo Grande', uf: 'MS', whatsapp: '6733841118',  site: 'http://www.gilmarbicicletas.com.br/', nota: 1 },
  { nome: 'arcanjosbikeshop',    cidade: 'Campo Grande', uf: 'MS', whatsapp: '67992869245', nota: 1 },
  { nome: 'Alex Ribeiro Sports', cidade: 'Curitiba',     uf: 'PR', whatsapp: '41992676838', instagram: 'alexribeiro.sports', nota: 1 },
  { nome: 'Concept Bike Shop',   cidade: 'Campo Grande', uf: 'MS', nota: 1 },
  { nome: 'iuri.wb',             cidade: 'Campo Grande', uf: 'MS', whatsapp: '6791855440',  nota: 1 },
  { nome: 'ciclo_mar',           cidade: 'Campo Grande', uf: 'MS', whatsapp: '6799533282',  nota: 1 },
  { nome: 'gino_bikesz0',        cidade: 'Campo Grande', uf: 'MS', whatsapp: '6792901038',  nota: 1 },
  { nome: 'luanbikeof_',         cidade: 'Campo Grande', uf: 'MS', nota: 1 },
  { nome: 'lucas_bikecg',        cidade: 'Campo Grande', uf: 'MS', nota: 1 },
  { nome: 'bikeeletricasaad',    cidade: 'Campo Grande', uf: 'MS', whatsapp: '6791775923',  nota: 2 },
]
let ins = 0, skip = 0
for (const c of CLIENTES_MS_PR) {
  const ok = await insertClient(c)
  if (ok) { console.log(`  ✅  ${c.nome} (${c.uf})`); ins++ } else { console.log(`  ⏭  ${c.nome} (${c.uf}) — já existe`); skip++ }
}
console.log(`  → ${ins} inseridos, ${skip} ignorados`)

// ── Batch 2: TO / PR (seed_clientes_batch2.js) ───────────────────────────────
console.log('\n▶ Inserindo clientes Batch2 (TO/PR)...')
const CLIENTES_BATCH2 = [
  { nome: 'Forum Bike',              cidade: 'Palmas',    uf: 'TO', nota: 2 },
  { nome: 'CiclomiX - Tocantins Bike', cidade: 'Palmas', uf: 'TO', whatsapp: '6332242111', site: 'https://ciclomix.com/', nota: 2 },
  { nome: 'Pedal Forte',             cidade: 'Palmas',    uf: 'TO', instagram: 'pedalfortebikes', nota: 2 },
  { nome: 'Bike Brother',            cidade: 'Palmas',    uf: 'TO', instagram: 'bikebrotherpalmas', nota: 1 },
  { nome: 'J Bike 122',              cidade: 'Palmas',    uf: 'TO', whatsapp: '63985170929', nota: 1 },
  { nome: "Giro Bike's",             cidade: 'Palmas',    uf: 'TO', whatsapp: '63992636599', nota: 2 },
  { nome: 'Bicicletas & Companhia',  cidade: 'Gurupi',    uf: 'TO', instagram: 'bicicletaecompanhia', nota: 1 },
  { nome: 'BIKE TECH',               cidade: 'Curitiba',  uf: 'PR', whatsapp: '4184186269',  site: 'https://www.biketechcuritiba.com.br/', nota: 2 },
  { nome: 'CBS Curitiba Bike Store', cidade: 'Curitiba',  uf: 'PR', site: 'https://www.curitibabikestore.com.br/', nota: 2 },
  { nome: 'Cicles Langner',          cidade: 'Curitiba',  uf: 'PR', whatsapp: '4187970865',  instagram: 'cicles_langner', nota: 2 },
  { nome: 'Cantelli Bike Shop',      cidade: 'Curitiba',  uf: 'PR', whatsapp: '4688228385',  instagram: 'cantelli.bikeshop', nota: 1 },
  { nome: 'Agencia Bicicleta',       cidade: 'Curitiba',  uf: 'PR', whatsapp: '41992076721', instagram: 'agencia_bicicleta', nota: 1 },
  { nome: 'veloxbikeshop',           cidade: 'Curitiba',  uf: 'PR', instagram: 'veloxbikeshop', nota: 1 },
  { nome: 'Ciclesradar',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '41998228665', instagram: 'ciclesradar', nota: 1 },
  { nome: 'Brychtabikes',            cidade: 'Curitiba',  uf: 'PR', whatsapp: '41995531622', instagram: 'brychtabikes', nota: 1 },
  { nome: 'baronbikes',              cidade: 'Curitiba',  uf: 'PR', instagram: 'baronbikes', site: 'https://www.baronbikes.com/', nota: 1 },
  { nome: 'Ciclesjaime',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '4132623707',  instagram: 'ciclesjaime', nota: 1 },
  { nome: 'Bikeportella',            cidade: 'Curitiba',  uf: 'PR', instagram: 'bikeportella', nota: 1 },
  { nome: 'Biketripbr',              cidade: 'Curitiba',  uf: 'PR', instagram: 'biketripbr', nota: 1 },
  { nome: 'Bikecentercuritiba',      cidade: 'Curitiba',  uf: 'PR', whatsapp: '12982159999', instagram: 'bikecentercuritiba', nota: 1 },
  { nome: 'Pardalbikes',             cidade: 'Curitiba',  uf: 'PR', whatsapp: '41997389245', instagram: 'pardalbikes', nota: 1 },
  { nome: 'Cicles Gabriel',          cidade: 'Curitiba',  uf: 'PR', whatsapp: '41998610206', instagram: 'cicles_gabriel', nota: 1 },
  { nome: 'Marechalbikecuritiba',    cidade: 'Curitiba',  uf: 'PR', instagram: 'marechalbikecuritiba', nota: 1 },
  { nome: 'Bikebrotherscuritiba',    cidade: 'Curitiba',  uf: 'PR', instagram: 'bikebrotherscuritiba', nota: 1 },
  { nome: 'Bicicletariacultural',    cidade: 'Curitiba',  uf: 'PR', instagram: 'bicicletariacultural', nota: 1 },
  { nome: 'Extremebikescuritiba',    cidade: 'Curitiba',  uf: 'PR', instagram: 'extremebikescuritiba', nota: 1 },
  { nome: 'Cr Bikes',                cidade: 'Curitiba',  uf: 'PR', instagram: 'cr_bikes_', nota: 1 },
  { nome: 'Bikeservicectba',         cidade: 'Curitiba',  uf: 'PR', instagram: 'bikeservicectba', nota: 1 },
  { nome: 'Ciclescentral',           cidade: 'Curitiba',  uf: 'PR', instagram: 'ciclescentral_', nota: 1 },
  { nome: 'Bikesport Cwb',           cidade: 'Curitiba',  uf: 'PR', nota: 1 },
]
ins = 0; skip = 0
for (const c of CLIENTES_BATCH2) {
  const ok = await insertClient(c)
  if (ok) { console.log(`  ✅  ${c.nome} (${c.uf})`); ins++ } else { console.log(`  ⏭  ${c.nome} (${c.uf}) — já existe`); skip++ }
}
console.log(`  → ${ins} inseridos, ${skip} ignorados`)

// ── PR / TO / MT / SE (seed_clientes_pr_to_mt_se.js) ─────────────────────────
console.log('\n▶ Inserindo clientes PR/TO/MT/SE...')
const CLIENTES_PR_TO_MT_SE = [
  { nome: 'Apucarana Bike Shop',           cidade: 'Apucarana',             uf: 'PR', whatsapp: '43996026553', instagram: 'apucaranabikeshop',       nota: 3 },
  { nome: 'Loja das Bicicletas Apucarana', cidade: 'Apucarana',             uf: 'PR', whatsapp: '4334321221',  instagram: 'lojadasbicicletas',        nota: 3 },
  { nome: 'Ferracioli Bike Shop',          cidade: 'Apucarana',             uf: 'PR', instagram: 'ferraciolibikeshop',                                 nota: 2 },
  { nome: 'Ana Bike | Bicicletaria',       cidade: 'Apucarana',             uf: 'PR', instagram: 'anabikee',                                           nota: 2 },
  { nome: 'Dias Bike e Moto de Cianorte',  cidade: 'Cianorte',              uf: 'PR', instagram: 'diasbikecia',                                        nota: 3 },
  { nome: 'RAL Bike',                      cidade: 'Cianorte',              uf: 'PR', instagram: 'ralbike',                                            nota: 2 },
  { nome: 'Pedal de Ouro Bike Shop',       cidade: 'Cianorte',              uf: 'PR', whatsapp: '44997366312', instagram: 'pedal_de_ouro_bikes',       nota: 3 },
  { nome: 'Pedal Bike',                    cidade: 'Francisco Beltrão',     uf: 'PR', whatsapp: '46991294401', instagram: 'pedalbikefb',               nota: 3 },
  { nome: 'Bike G3',                       cidade: 'Francisco Beltrão',     uf: 'PR', instagram: 'bikeg3fb',                                           nota: 2 },
  { nome: "D'anas Bike",                   cidade: 'Francisco Beltrão',     uf: 'PR', whatsapp: '46991234145', instagram: 'danas_bike',                nota: 3 },
  { nome: 'Central Bike',                  cidade: 'Ibiporã',               uf: 'PR', whatsapp: '4332584852',  instagram: 'storecentralbike',          nota: 3 },
  { nome: 'Ponto das Bicicletas',          cidade: 'Ibiporã',               uf: 'PR', instagram: 'pontodasbicicletas',                                 nota: 2 },
  { nome: 'Pro Bikes Arapongas',           cidade: 'Arapongas',             uf: 'PR', whatsapp: '4331525144',  instagram: 'probikesarapongas',         nota: 3 },
  { nome: 'GT Bike Shop',                  cidade: 'Arapongas',             uf: 'PR', instagram: 'gt_bikeshop_',                                       nota: 2 },
  { nome: 'Shazan Bike e Motos',           cidade: 'Arapongas',             uf: 'PR', whatsapp: '43999640507', instagram: 'shazan_bike_e_motos',       nota: 3 },
  { nome: 'Pato Bike',                     cidade: 'Pato Branco',           uf: 'PR', instagram: 'patobikepb',                                         nota: 2 },
  { nome: 'Moto Bike',                     cidade: 'Pato Branco',           uf: 'PR', instagram: 'motobikemb',                                         nota: 2 },
  { nome: 'Torino Bikes',                  cidade: 'Pato Branco',           uf: 'PR', instagram: 'torinobikes',                                        nota: 2 },
  { nome: 'Elite Bike Shop',               cidade: 'Palmas',                uf: 'TO', instagram: 'elite_bike_shoppalmas',                              nota: 3 },
  { nome: 'Bicicletão Bike Shop Palmas',   cidade: 'Palmas',                uf: 'TO', instagram: 'bicicletaopalmas',                                   nota: 3 },
  { nome: 'Super Bike',                    cidade: 'Palmas',                uf: 'TO', instagram: 'super_bike_mtb',                                     nota: 2 },
  { nome: 'Palmas Moto & Bike Shop',       cidade: 'Palmas',                uf: 'TO', instagram: 'palmasmotobikeshop',                                 nota: 3 },
  { nome: "Camelo's Bike",                 cidade: 'Palmas',                uf: 'TO', whatsapp: '63992858260', instagram: 'camelosbike_pmw',           nota: 3 },
  { nome: 'New Bike Palmas',               cidade: 'Palmas',                uf: 'TO', whatsapp: '63984004402', instagram: 'newbikepalmas',             nota: 3 },
  { nome: 'Aro Ciclo',                     cidade: 'Palmas',                uf: 'TO', whatsapp: '6332152324',  instagram: 'arociclo',                  nota: 3 },
  { nome: 'Giro Bikes',                    cidade: 'Palmas',                uf: 'TO', instagram: 'girobikes.pmw',                                      nota: 2 },
  { nome: 'Bicicletão Bike Shop Araguaína',cidade: 'Araguaína',             uf: 'TO', instagram: 'bicicletaoaraguaina',                                nota: 3 },
  { nome: 'DM Bikes',                      cidade: 'Araguaína',             uf: 'TO', whatsapp: '63993009191', instagram: 'dmbikesaux',                nota: 3 },
  { nome: 'Rafa Bike Shop',                cidade: 'Araguaína',             uf: 'TO', instagram: 'rafabikearaguaina',                                  nota: 2 },
  { nome: 'Bike Silva',                    cidade: 'Araguaína',             uf: 'TO', instagram: 'bikesilva.oficial',                                  nota: 2 },
  { nome: 'Top Bike',                      cidade: 'Gurupi',                uf: 'TO', whatsapp: '6333122402',  instagram: 'topbikewm',                 nota: 3 },
  { nome: 'Bicicleta & Cia',               cidade: 'Gurupi',                uf: 'TO', instagram: 'bicicletaeciagurupi',                                nota: 3 },
  { nome: 'L2 Bike Shop',                  cidade: 'Gurupi',                uf: 'TO', whatsapp: '6333132269',  instagram: 'l2bikeshop.gpi',            nota: 3 },
  { nome: "Netto Bike's",                  cidade: 'Gurupi',                uf: 'TO', whatsapp: '63992132709', instagram: 'netto_bikes',               nota: 3 },
  { nome: 'Pedal Ciclo',                   cidade: 'Paraíso do Tocantins',  uf: 'TO', whatsapp: '6336021284',  instagram: 'pedalciclopso',             nota: 3 },
  { nome: 'Mais Bicicletas',               cidade: 'Paraíso do Tocantins',  uf: 'TO', instagram: 'mais_bicicletas',                                    nota: 2 },
  { nome: 'BAISCON Moto Peças e Bikes',    cidade: 'Porto Nacional',        uf: 'TO', instagram: 'baiscon.mb',                                         nota: 2 },
  { nome: 'Bicicletão Bike Shop Colinas',  cidade: 'Colinas do Tocantins',  uf: 'TO', instagram: 'bicicletaocolinas',                                  nota: 3 },
  { nome: 'Radical Bike Cuiabá',           cidade: 'Cuiabá',                uf: 'MT', instagram: 'radicalbikecuiaba',                                  nota: 3 },
  { nome: 'S2 Bike Shop Cuiabá',           cidade: 'Cuiabá',                uf: 'MT', instagram: 's2cuiabamt',                                         nota: 3 },
  { nome: 'Ciclo Machado Cuiabá - Porto',  cidade: 'Cuiabá',                uf: 'MT', instagram: 'ciclomachado_cba',                                   nota: 3 },
  { nome: 'Adrenalina Esporte Bike',       cidade: 'Cuiabá',                uf: 'MT', whatsapp: '65996601293', instagram: 'adrenalinacba',             nota: 3 },
  { nome: 'Bueno Bike Shop',               cidade: 'Cuiabá',                uf: 'MT', instagram: 'buenobikeshopp',                                     nota: 2 },
  { nome: 'Bike 25 Outlet Cuiabá',         cidade: 'Cuiabá',                uf: 'MT', instagram: 'bike25cuiaba',                                       nota: 2 },
  { nome: 'S2 Bike Shop Rondonópolis',     cidade: 'Rondonópolis',          uf: 'MT', whatsapp: '66996868121', instagram: 's2rondonopolismt',          nota: 3 },
  { nome: 'Ciclo Machado VG',              cidade: 'Várzea Grande',         uf: 'MT', instagram: 'ciclomachadomt',                                     nota: 3 },
  { nome: 'Ciclo Rabelo',                  cidade: 'Várzea Grande',         uf: 'MT', instagram: 'ciclorabelo',                                        nota: 3 },
  { nome: 'R Bike Shop MT',                cidade: 'Várzea Grande',         uf: 'MT', whatsapp: '65993294549', instagram: 'rbikeshopmt',               nota: 3 },
  { nome: 'GR Bicicletas',                 cidade: 'Várzea Grande',         uf: 'MT', instagram: 'gr.bicicletas',                                      nota: 3 },
  { nome: 'Ciclo Brasil Motos Bicicletas', cidade: 'Várzea Grande',         uf: 'MT', whatsapp: '65992070723', instagram: 'ciclobrasilmb',             nota: 3 },
  { nome: 'Bike Aju Shop e Manutenção',    cidade: 'Aracaju',               uf: 'SE', instagram: 'bikeajushop',                                        nota: 3 },
  { nome: 'CF Bike Shop',                  cidade: 'Aracaju',               uf: 'SE', instagram: 'cfbikeshop',                                         nota: 3 },
  { nome: 'RR Bike',                       cidade: 'Aracaju',               uf: 'SE', instagram: 'rr.bike',                                            nota: 3 },
  { nome: 'Ciclo Nutri Bike Shop',         cidade: 'Aracaju',               uf: 'SE', instagram: 'ciclonutribikeshop',                                 nota: 3 },
  { nome: 'Novo Giro Bike Shop',           cidade: 'Aracaju',               uf: 'SE', instagram: 'novogirobikeshop',                                   nota: 3 },
  { nome: 'Conection Bike Show',           cidade: 'Aracaju',               uf: 'SE', instagram: '_conectionbikeshow',                                 nota: 2 },
  { nome: 'Ciclo Santos',                  cidade: 'Nossa Senhora do Socorro', uf: 'SE', whatsapp: '79988483820', instagram: 'ciclosantos',            nota: 3 },
  { nome: 'Imperador das Bikes',           cidade: 'Nossa Senhora do Socorro', uf: 'SE', whatsapp: '79981390437', instagram: 'imperadorr_das_bikes',   nota: 2 },
  { nome: 'Loja Júnior Bike',              cidade: 'Lagarto',               uf: 'SE', instagram: 'loja_juniorbike',                                    nota: 3 },
  { nome: 'Cunhadinho Bike Show',          cidade: 'Lagarto',               uf: 'SE', instagram: 'cunhadinhobikeshow',                                 nota: 3 },
  { nome: 'Stop Bike SE',                  cidade: 'Lagarto',               uf: 'SE', whatsapp: '79999728577', instagram: 'stopbike_se',               nota: 3 },
  { nome: 'Sandro Motos Bikes',            cidade: 'Itabaiana',             uf: 'SE', whatsapp: '79996045285', instagram: 'sandrobikes',               nota: 3 },
  { nome: 'Aline Bicicletas',              cidade: 'São Domingos',          uf: 'SE', instagram: 'alinebicicletas',                                    nota: 3 },
  { nome: 'Yossef Bike Show',              cidade: 'São Cristóvão',         uf: 'SE', instagram: 'yossef_bike_show',                                   nota: 2 },
  { nome: 'Sport Bike Estância',           cidade: 'Estância',              uf: 'SE', whatsapp: '79998687405', instagram: 'sportbikeestancia',         nota: 3 },
]
ins = 0; skip = 0
for (const c of CLIENTES_PR_TO_MT_SE) {
  const ok = await insertClient(c)
  if (ok) { console.log(`  ✅  ${c.nome} (${c.uf})`); ins++ } else { console.log(`  ⏭  ${c.nome} (${c.uf}) — já existe`); skip++ }
}
console.log(`  → ${ins} inseridos, ${skip} ignorados`)

// ── Resumo ────────────────────────────────────────────────────────────────────
const { rows: total } = await pool.query('SELECT COUNT(*) as n FROM clients WHERE company_id=$1', [COMPANY_ID])
console.log(`\n✅ Recovery concluído. Total de clientes na Atomi: ${total[0].n}\n`)
await pool.end()
