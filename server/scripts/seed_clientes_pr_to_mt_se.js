/**
 * Seed: clientes PR / TO / MT / SE
 * Execute: cd server && bun run scripts/seed_clientes_pr_to_mt_se.js
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') })
import db from '../src/db/db.js'

// Thiago = id 2 (MT/MS/TO/SE/PR)
const SELLER_ID = 2

const CLIENTES = [
  // ── PARANÁ ──────────────────────────────────────────────────────────────
  { nome: 'Apucarana Bike Shop',        cidade: 'Apucarana',             uf: 'PR', whatsapp: '43996026553',  instagram: 'apucaranabikeshop',        nota: 3 },
  { nome: 'Loja das Bicicletas Apucarana', cidade: 'Apucarana',          uf: 'PR', whatsapp: '4334321221',   instagram: 'lojadasbicicletas',          nota: 3 },
  { nome: 'Ferracioli Bike Shop',        cidade: 'Apucarana',            uf: 'PR', whatsapp: null,           instagram: 'ferraciolibikeshop',          nota: 2 },
  { nome: 'Ana Bike | Bicicletaria',     cidade: 'Apucarana',            uf: 'PR', whatsapp: null,           instagram: 'anabikee',                   nota: 2 },
  { nome: 'Dias Bike e Moto de Cianorte',cidade: 'Cianorte',             uf: 'PR', whatsapp: null,           instagram: 'diasbikecia',                nota: 3 },
  { nome: 'RAL Bike',                    cidade: 'Cianorte',             uf: 'PR', whatsapp: null,           instagram: 'ralbike',                    nota: 2 },
  { nome: 'Pedal de Ouro Bike Shop',     cidade: 'Cianorte',             uf: 'PR', whatsapp: '44997366312',  instagram: 'pedal_de_ouro_bikes',         nota: 3 },
  { nome: 'Pedal Bike',                  cidade: 'Francisco Beltrão',    uf: 'PR', whatsapp: '46991294401',  instagram: 'pedalbikefb',                nota: 3 },
  { nome: 'Bike G3',                     cidade: 'Francisco Beltrão',    uf: 'PR', whatsapp: null,           instagram: 'bikeg3fb',                   nota: 2 },
  { nome: "D'anas Bike",                 cidade: 'Francisco Beltrão',    uf: 'PR', whatsapp: '46991234145',  instagram: 'danas_bike',                 nota: 3 },
  { nome: 'Central Bike',                cidade: 'Ibiporã',              uf: 'PR', whatsapp: '4332584852',   instagram: 'storecentralbike',           nota: 3 },
  { nome: 'Ponto das Bicicletas',        cidade: 'Ibiporã',              uf: 'PR', whatsapp: null,           instagram: 'pontodasbicicletas',          nota: 2 },
  { nome: 'Pro Bikes Arapongas',         cidade: 'Arapongas',            uf: 'PR', whatsapp: '4331525144',   instagram: 'probikesarapongas',           nota: 3 },
  { nome: 'GT Bike Shop',                cidade: 'Arapongas',            uf: 'PR', whatsapp: null,           instagram: 'gt_bikeshop_',               nota: 2 },
  { nome: 'Shazan Bike e Motos',         cidade: 'Arapongas',            uf: 'PR', whatsapp: '43999640507',  instagram: 'shazan_bike_e_motos',         nota: 3 },
  { nome: 'Pato Bike',                   cidade: 'Pato Branco',          uf: 'PR', whatsapp: null,           instagram: 'patobikepb',                 nota: 2 },
  { nome: 'Moto Bike',                   cidade: 'Pato Branco',          uf: 'PR', whatsapp: null,           instagram: 'motobikemb',                 nota: 2 },
  { nome: 'Torino Bikes',                cidade: 'Pato Branco',          uf: 'PR', whatsapp: null,           instagram: 'torinobikes',                nota: 2 },

  // ── TOCANTINS ────────────────────────────────────────────────────────────
  { nome: 'Elite Bike Shop',             cidade: 'Palmas',               uf: 'TO', whatsapp: null,           instagram: 'elite_bike_shoppalmas',       nota: 3 },
  { nome: 'Bicicletão Bike Shop Palmas', cidade: 'Palmas',               uf: 'TO', whatsapp: null,           instagram: 'bicicletaopalmas',            nota: 3 },
  { nome: 'Super Bike',                  cidade: 'Palmas',               uf: 'TO', whatsapp: null,           instagram: 'super_bike_mtb',              nota: 2 },
  { nome: 'Palmas Moto & Bike Shop',     cidade: 'Palmas',               uf: 'TO', whatsapp: null,           instagram: 'palmasmotobikeshop',          nota: 3 },
  { nome: "Camelo's Bike",               cidade: 'Palmas',               uf: 'TO', whatsapp: '63992858260',  instagram: 'camelosbike_pmw',             nota: 3 },
  { nome: 'New Bike Palmas',             cidade: 'Palmas',               uf: 'TO', whatsapp: '63984004402',  instagram: 'newbikepalmas',               nota: 3 },
  { nome: 'Aro Ciclo',                   cidade: 'Palmas',               uf: 'TO', whatsapp: '6332152324',   instagram: 'arociclo',                   nota: 3 },
  { nome: 'Giro Bikes',                  cidade: 'Palmas',               uf: 'TO', whatsapp: null,           instagram: 'girobikes.pmw',              nota: 2 },
  { nome: 'Bicicletão Bike Shop Araguaína', cidade: 'Araguaína',         uf: 'TO', whatsapp: null,           instagram: 'bicicletaoaraguaina',         nota: 3 },
  { nome: 'DM Bikes',                    cidade: 'Araguaína',            uf: 'TO', whatsapp: '63993009191',  instagram: 'dmbikesaux',                 nota: 3 },
  { nome: 'Rafa Bike Shop',              cidade: 'Araguaína',            uf: 'TO', whatsapp: null,           instagram: 'rafabikearaguaina',           nota: 2 },
  { nome: 'Bike Silva',                  cidade: 'Araguaína',            uf: 'TO', whatsapp: null,           instagram: 'bikesilva.oficial',           nota: 2 },
  { nome: 'Top Bike',                    cidade: 'Gurupi',               uf: 'TO', whatsapp: '6333122402',   instagram: 'topbikewm',                  nota: 3 },
  { nome: 'Bicicleta & Cia',             cidade: 'Gurupi',               uf: 'TO', whatsapp: null,           instagram: 'bicicletaeciagurupi',         nota: 3 },
  { nome: 'L2 Bike Shop',                cidade: 'Gurupi',               uf: 'TO', whatsapp: '6333132269',   instagram: 'l2bikeshop.gpi',             nota: 3 },
  { nome: "Netto Bike's",                cidade: 'Gurupi',               uf: 'TO', whatsapp: '63992132709',  instagram: 'netto_bikes',                nota: 3 },
  { nome: 'Pedal Ciclo',                 cidade: 'Paraíso do Tocantins', uf: 'TO', whatsapp: '6336021284',   instagram: 'pedalciclopso',              nota: 3 },
  { nome: 'Mais Bicicletas',             cidade: 'Paraíso do Tocantins', uf: 'TO', whatsapp: null,           instagram: 'mais_bicicletas',            nota: 2 },
  { nome: 'BAISCON Moto Peças e Bikes',  cidade: 'Porto Nacional',       uf: 'TO', whatsapp: null,           instagram: 'baiscon.mb',                 nota: 2 },
  { nome: 'Bicicletão Bike Shop Colinas',cidade: 'Colinas do Tocantins', uf: 'TO', whatsapp: null,           instagram: 'bicicletaocolinas',           nota: 3 },

  // ── MATO GROSSO ──────────────────────────────────────────────────────────
  { nome: 'Radical Bike Cuiabá',         cidade: 'Cuiabá',               uf: 'MT', whatsapp: null,           instagram: 'radicalbikecuiaba',           nota: 3 },
  { nome: 'S2 Bike Shop Cuiabá',         cidade: 'Cuiabá',               uf: 'MT', whatsapp: null,           instagram: 's2cuiabamt',                 nota: 3 },
  { nome: 'Ciclo Machado Cuiabá - Porto',cidade: 'Cuiabá',               uf: 'MT', whatsapp: null,           instagram: 'ciclomachado_cba',            nota: 3 },
  { nome: 'Adrenalina Esporte Bike',     cidade: 'Cuiabá',               uf: 'MT', whatsapp: '65996601293',  instagram: 'adrenalinacba',              nota: 3 },
  { nome: 'Bueno Bike Shop',             cidade: 'Cuiabá',               uf: 'MT', whatsapp: null,           instagram: 'buenobikeshopp',             nota: 2 },
  { nome: 'Bike 25 Outlet Cuiabá',       cidade: 'Cuiabá',               uf: 'MT', whatsapp: null,           instagram: 'bike25cuiaba',               nota: 2 },
  { nome: 'S2 Bike Shop Rondonópolis',   cidade: 'Rondonópolis',         uf: 'MT', whatsapp: '66996868121',  instagram: 's2rondonopolismt',            nota: 3 },
  { nome: 'Ciclo Machado VG',            cidade: 'Várzea Grande',        uf: 'MT', whatsapp: null,           instagram: 'ciclomachadomt',             nota: 3 },
  { nome: 'Ciclo Rabelo',                cidade: 'Várzea Grande',        uf: 'MT', whatsapp: null,           instagram: 'ciclorabelo',                nota: 3 },
  { nome: 'R Bike Shop MT',              cidade: 'Várzea Grande',        uf: 'MT', whatsapp: '65993294549',  instagram: 'rbikeshopmt',                nota: 3 },
  { nome: 'GR Bicicletas',               cidade: 'Várzea Grande',        uf: 'MT', whatsapp: null,           instagram: 'gr.bicicletas',              nota: 3 },
  { nome: 'Ciclo Brasil Motos Bicicletas',cidade: 'Várzea Grande',       uf: 'MT', whatsapp: '65992070723',  instagram: 'ciclobrasilmb',              nota: 3 },

  // ── SERGIPE ───────────────────────────────────────────────────────────────
  { nome: 'Bike Aju Shop e Manutenção',  cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: 'bikeajushop',                nota: 3 },
  { nome: 'CF Bike Shop',                cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: 'cfbikeshop',                 nota: 3 },
  { nome: 'RR Bike',                     cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: 'rr.bike',                    nota: 3 },
  { nome: 'Ciclo Nutri Bike Shop',       cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: 'ciclonutribikeshop',          nota: 3 },
  { nome: 'Novo Giro Bike Shop',         cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: 'novogirobikeshop',            nota: 3 },
  { nome: 'Conection Bike Show',         cidade: 'Aracaju',              uf: 'SE', whatsapp: null,           instagram: '_conectionbikeshow',          nota: 2 },
  { nome: 'Ciclo Santos',                cidade: 'Nossa Senhora do Socorro', uf: 'SE', whatsapp: '79988483820', instagram: 'ciclosantos',              nota: 3 },
  { nome: 'Imperador das Bikes',         cidade: 'Nossa Senhora do Socorro', uf: 'SE', whatsapp: '79981390437', instagram: 'imperadorr_das_bikes',      nota: 2 },
  { nome: 'Loja Júnior Bike',            cidade: 'Lagarto',              uf: 'SE', whatsapp: null,           instagram: 'loja_juniorbike',            nota: 3 },
  { nome: 'Cunhadinho Bike Show',        cidade: 'Lagarto',              uf: 'SE', whatsapp: null,           instagram: 'cunhadinhobikeshow',          nota: 3 },
  { nome: 'Stop Bike SE',                cidade: 'Lagarto',              uf: 'SE', whatsapp: '79999728577',  instagram: 'stopbike_se',                nota: 3 },
  { nome: 'Sandro Motos Bikes',          cidade: 'Itabaiana',            uf: 'SE', whatsapp: '79996045285',  instagram: 'sandrobikes',                nota: 3 },
  { nome: 'Aline Bicicletas',            cidade: 'São Domingos',         uf: 'SE', whatsapp: null,           instagram: 'alinebicicletas',            nota: 3 },
  { nome: 'Yossef Bike Show',            cidade: 'São Cristóvão',        uf: 'SE', whatsapp: null,           instagram: 'yossef_bike_show',           nota: 2 },
  { nome: 'Sport Bike Estância',         cidade: 'Estância',             uf: 'SE', whatsapp: '79998687405',  instagram: 'sportbikeestancia',          nota: 3 },
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
    `INSERT INTO clients (nome, cidade, uf, whatsapp, instagram, nota, seller_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [c.nome, c.cidade, c.uf, c.whatsapp, c.instagram, c.nota, SELLER_ID]
  )
  console.log(`  ✓  ${c.nome} (${c.cidade}/${c.uf})`)
  inseridos++
}

console.log(`\nConcluído: ${inseridos} inseridos, ${ignorados} ignorados.`)
process.exit(0)
