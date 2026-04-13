/**
 * Overpass API (OpenStreetMap) — fallback gratuito para Prospecção.
 *
 * Vantagens: 100% gratuito, sem chave de API, sem limite de uso.
 * Desvantagens: cobertura variável, sem ratings, telefones incompletos.
 *
 * Usado como último fallback da cadeia Maps:
 *   Serper Maps → SerpAPI Maps → Overpass (este arquivo)
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Termos PT-BR → filtros de tag OSM (prefixos para casamento parcial)
const TERM_TAGS = [
  // Saúde
  ['farmac',       '["amenity"="pharmacy"]'],
  ['drogar',       '["amenity"="pharmacy"]'],
  ['clinic',       '["amenity"~"clinic|hospital|doctors"]'],
  ['hospital',     '["amenity"="hospital"]'],
  ['medic',        '["amenity"~"clinic|hospital|doctors"]'],
  ['dentist',      '["amenity"="dentist"]'],
  ['otica',        '["shop"="optician"]'],
  ['optic',        '["shop"="optician"]'],
  // Alimentação
  ['restaur',      '["amenity"="restaurant"]'],
  ['pizzar',       '["amenity"="restaurant"]'],
  ['lanch',        '["amenity"~"fast_food|cafe"]'],
  ['padari',       '["shop"="bakery"]'],
  ['confeit',      '["shop"="confectionery"]'],
  ['supermercad',  '["shop"="supermarket"]'],
  ['mercad',       '["shop"~"supermarket|convenience"]'],
  ['acougue',      '["shop"="butcher"]'],
  ['cafe',         '["amenity"="cafe"]'],
  ['sorvet',       '["amenity"~"cafe|ice_cream"]'],
  // Auto
  ['posto',        '["amenity"="fuel"]'],
  ['combustiv',    '["amenity"="fuel"]'],
  ['oficin',       '["shop"="car_repair"]'],
  ['mecanic',      '["shop"="car_repair"]'],
  ['lavagem',      '["amenity"="car_wash"]'],
  ['borrachei',    '["shop"="tyres"]'],
  // Serviços pessoais
  ['academia',     '["leisure"="fitness_centre"]'],
  ['salao',        '["shop"~"hairdresser|beauty"]'],
  ['cabelel',      '["shop"="hairdresser"]'],
  ['barbeari',     '["shop"="hairdresser"]'],
  ['lavandar',     '["shop"~"laundry|dry_cleaning"]'],
  // Pets
  ['petshop',      '["shop"="pet"]'],
  ['pet shop',     '["shop"="pet"]'],
  ['veterinar',    '["amenity"="veterinary"]'],
  // Tecnologia
  ['celular',      '["shop"="mobile_phone"]'],
  ['informatic',   '["shop"="computer"]'],
  // Construção
  ['material de',  '["shop"~"hardware|doityourself"]'],
  ['ferramenta',   '["shop"="hardware"]'],
  ['construct',    '["shop"~"hardware|doityourself"]'],
  // Educação
  ['escola',       '["amenity"~"school|college"]'],
  ['creche',       '["amenity"="kindergarten"]'],
  ['universid',    '["amenity"="university"]'],
  // Livraria
  ['livrar',       '["shop"="books"]'],
  // Açougue (com acento)
  ['açougue',      '["shop"="butcher"]'],
]

function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Mapeia um termo de busca PT-BR para um filtro de tag OSM.
 * Se não encontrar, usa busca por nome (~"termo","i").
 */
function getOsmFilter(segment) {
  const norm = normalize(segment)
  for (const [term, filter] of TERM_TAGS) {
    if (norm.includes(normalize(term))) return filter
  }
  // Fallback: busca no atributo "name" do OSM
  const escaped = segment.replace(/["\\]/g, '').trim()
  return `["name"~"${escaped}","i"]`
}

/**
 * Busca estabelecimentos no OpenStreetMap via Overpass API.
 * Retorna no mesmo shape que searchPlaces() do serper.js.
 *
 * Retorna null se: sem cidade, timeout, erro de rede ou sem resultados.
 */
export async function searchPlacesOverpass(segment, city, uf) {
  if (!city) {
    console.log('[Overpass] sem cidade — busca muito ampla, ignorando')
    return null
  }

  const osmFilter = getOsmFilter(segment)

  // admin_level 8 = municípios no Brasil; 9 = distritos/subprefeituras
  const areaQL = `area["name"~"^${city.trim()}$","i"]["admin_level"~"^[89]$"]->.a;`

  const query = `[out:json][timeout:20];
${areaQL}
(
  nwr${osmFilter}(area.a);
);
out center 20;`

  let response
  try {
    response = await fetch(OVERPASS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `data=${encodeURIComponent(query)}`,
      signal:  AbortSignal.timeout(25000),
    })
  } catch (err) {
    console.warn(`[Overpass] erro de rede: ${err.message}`)
    return null
  }

  if (!response.ok) {
    console.warn(`[Overpass] HTTP ${response.status}`)
    return null
  }

  let data
  try { data = await response.json() } catch { return null }

  const elements = (data.elements || []).filter(el => el.tags?.name)
  if (elements.length === 0) {
    console.log(`[Overpass] 0 resultados para "${segment}" em "${city}"`)
    return null
  }

  const places = elements.slice(0, 20).map(el => {
    const tags = el.tags || {}

    const addrParts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:suburb'],
      tags['addr:city'] || city,
      tags['addr:state'] || uf,
    ].filter(Boolean)

    // Normaliza telefone: remove código de país BR
    const rawPhone = (tags.phone || tags['contact:phone'] || tags['phone:br'] || '').trim()
    const phone = rawPhone
      ? rawPhone.replace(/^\+?55[-\s]?/, '').replace(/\s/g, '').trim() || null
      : null

    const website = tags.website || tags['contact:website'] || tags.url || null
    const type    = tags.amenity || tags.shop || tags.leisure || tags.office || null

    return {
      title:       tags.name,
      address:     addrParts.join(', ') || null,
      phone:       phone || null,
      website:     website || null,
      rating:      null,
      ratingCount: null,
      type:        type   || null,
    }
  })

  console.log(`[Overpass] ${places.length} resultados para "${segment}" em "${city}"`)
  return { places, creditsUsed: 0, source: 'openstreetmap' }
}
