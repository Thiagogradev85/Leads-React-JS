import * as XLSX from 'xlsx'

const KNOWN_UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
])

// Nome completo / variações de estado → sigla
const STATE_NAME_TO_UF = {
  'acre': 'AC',
  'alagoas': 'AL',
  'amapa': 'AP', 'amapá': 'AP',
  'amazonas': 'AM',
  'bahia': 'BA',
  'ceara': 'CE', 'ceará': 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES', 'espírito santo': 'ES',
  'goias': 'GO', 'goiás': 'GO',
  'maranhao': 'MA', 'maranhão': 'MA',
  'mato grosso do sul': 'MS', 'mato_grosso_do_sul': 'MS',
  'mato grosso': 'MT', 'mato_grosso': 'MT',
  'minas gerais': 'MG', 'minas_gerais': 'MG',
  'para': 'PA', 'pará': 'PA',
  'paraiba': 'PB', 'paraíba': 'PB', 'paraiba': 'PB',
  'parana': 'PR', 'paraná': 'PR', 'parana': 'PR',
  'pernambuco': 'PE',
  'piaui': 'PI', 'piauí': 'PI',
  'rio de janeiro': 'RJ', 'rio_de_janeiro': 'RJ',
  'rio grande do norte': 'RN', 'rio_grande_do_norte': 'RN',
  'rio grande do sul': 'RS', 'rio_grande_do_sul': 'RS',
  'rondonia': 'RO', 'rondônia': 'RO',
  'roraima': 'RR',
  'santa catarina': 'SC', 'santa_catarina': 'SC',
  'sao paulo': 'SP', 'são paulo': 'SP', 'sao_paulo': 'SP',
  'sergipe': 'SE',
  'tocantins': 'TO',
}

const UF_REGEX = /\b([A-Z]{2})\b/

// Normaliza string removendo acentos e convertendo para minúsculas
function normalize(str) {
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .trim()
}

// Localiza índice da coluna pelo cabeçalho (busca parcial, case-insensitive)
function findCol(headers, ...keywords) {
  return headers.findIndex(h =>
    keywords.some(k => normalize(String(h)).includes(normalize(k)))
  )
}

// Extrai UF de qualquer string (coluna, nome de aba, célula etc.)
function extractUF(value) {
  if (!value) return null
  const str = String(value).trim()

  // 1. Tenta pelo nome completo do estado (com/sem underscore/acento)
  const norm = normalize(str)
  for (const [name, uf] of Object.entries(STATE_NAME_TO_UF)) {
    const nameNorm = normalize(name)
    if (norm === nameNorm || norm.startsWith(nameNorm) || norm.includes(nameNorm)) return uf
  }

  // 2. Sigla de 2 letras maiúsculas
  const upper = str.toUpperCase()
  const match = upper.match(UF_REGEX)
  if (match && KNOWN_UFS.has(match[1])) return match[1]

  // 3. Valor todo é exatamente uma sigla válida (ex: "sp")
  if (KNOWN_UFS.has(upper.trim())) return upper.trim()

  return null
}

function clean(value) {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).trim()
  return s || null
}

// Extrai apenas dígitos e normaliza número BR (adiciona DDI 55 se necessário)
function cleanDigits(value) {
  if (!value) return null
  const digits = String(value).replace(/\D/g, '')
  if (!digits || digits.length < 8) return null
  return digits
}

// Detecta se um número é celular brasileiro:
// - 11 dígitos locais: qualquer DDD + 9 + 8 dígitos (formato atual)
// - 10 dígitos locais: qualquer DDD + dígito 6-9 (formatos antigos de celular)
// Aceita também números com DDI 55 à frente (12-13 dígitos)
function isCelular(digits) {
  if (!digits) return false
  // Remove DDI 55 se tiver 12 ou 13 dígitos
  let local = digits
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    local = digits.slice(2)
  }
  // 11 dígitos: celular atual (DDD + 9XXXXXXXX)
  if (local.length === 11 && local[2] === '9') return true
  // 10 dígitos: celular antigo (DDD + 8/7/6XXXXXXX) ou 9XXXXXXX sem o nono dígito
  if (local.length === 10 && ['6','7','8','9'].includes(local[2])) return true
  return false
}

// Limpa e valida como celular — retorna o número limpo (só dígitos) ou null
function cleanPhone(value) {
  const digits = cleanDigits(value)
  if (!digits) return null
  return isCelular(digits) ? digits : null
}

// Extrai handle/URL do Instagram de uma célula qualquer
// Aceita: @loja, loja, instagram.com/loja, https://instagram.com/loja
const INSTAGRAM_URL_RE = /instagram\.com\/([A-Za-z0-9_.]+)/i
const INSTAGRAM_HANDLE_RE = /^@?([A-Za-z0-9_.]{2,30})$/

function extractInstagram(value) {
  if (!value) return null
  const s = String(value).trim()
  if (!s) return null

  // URL completa: instagram.com/usuario
  const urlMatch = s.match(INSTAGRAM_URL_RE)
  if (urlMatch) return '@' + urlMatch[1]

  // Handle direto: @usuario ou usuario (sem espaços, caracteres válidos)
  // Ignora células que parecem ser números, nomes de cidade ou textos longos
  if (s.includes(' ') || s.length > 35) return null
  const handleMatch = s.match(INSTAGRAM_HANDLE_RE)
  if (handleMatch) {
    // Descarta se parece UF, número puro, ou valor muito curto
    if (KNOWN_UFS.has(s.toUpperCase())) return null
    if (/^\d+$/.test(s)) return null
    if (s.length < 2) return null
    return s.startsWith('@') ? s : '@' + s
  }

  return null
}

export async function importExcel(fileOrBuffer) {
  const workbook = XLSX.read(fileOrBuffer, { type: 'buffer' })
  const records = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (rows.length < 2) continue

    // UF da aba (ex: "Parana" → "PR", "Mato_Grosso" → "MT")
    const sheetUF = extractUF(sheetName)

    // Encontra a primeira linha que parece ser cabeçalho (contém texto não-numérico)
    let headerRowIdx = 0
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const hasText = rows[i].some(c => isNaN(c) && String(c).trim().length > 1)
      if (hasText) { headerRowIdx = i; break }
    }

    const headers = rows[headerRowIdx]

    // Mapeamento flexível — aceita muitas variações de nome de coluna
    const iNome      = findCol(headers,
      'nome', 'name', 'loja', 'empresa', 'cliente', 'fantasia', 'razao', 'razão',
      'estabelecimento', 'razao social', 'nome fantasia')
    const iCidade    = findCol(headers,
      'cidade', 'city', 'municipio', 'município', 'localidade')
    const iUF        = findCol(headers,
      'uf', 'estado', 'state', 'estado/uf', 'uf/estado', 'sigla')
    const iWhatsapp  = findCol(headers,
      'whatsapp', 'wpp', 'whats', 'celular', 'cel', 'telefone', 'fone',
      'tel', 'phone', 'zap', 'contato', 'numero', 'número', 'mobile', 'movel', 'móvel')
    const iSite      = findCol(headers,
      'site', 'website', 'url', 'www', 'homepage', 'web')
    const iInstagram = findCol(headers,
      'instagram', 'ig', 'insta', '@', 'perfil', 'rede social', 'social', 'redes')

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i]

      // Ignora linhas completamente vazias
      if (row.every(cell => !String(cell).trim())) continue

      const nome = iNome >= 0 ? clean(row[iNome]) : null
      if (!nome) continue

      // UF: coluna dedicada → escaneia todas as células → nome da aba
      let uf = iUF >= 0 ? extractUF(row[iUF]) : null
      if (!uf) {
        for (const cell of row) {
          uf = extractUF(cell)
          if (uf) break
        }
      }
      if (!uf) uf = sheetUF  // fallback: usa o UF do nome da aba
      if (!uf) continue       // ainda sem UF → pula

      // WhatsApp: tenta coluna dedicada, depois escaneia todas as células
      let whatsapp = iWhatsapp >= 0 ? cleanPhone(row[iWhatsapp]) : null
      if (!whatsapp) {
        // Tenta encontrar um celular em qualquer célula da linha
        for (const cell of row) {
          const candidate = cleanPhone(cell)
          if (candidate) { whatsapp = candidate; break }
        }
      }

      // Instagram: coluna dedicada → varredura de todas as células
      let instagram = iInstagram >= 0 ? extractInstagram(row[iInstagram]) : null
      if (!instagram) {
        for (const cell of row) {
          const candidate = extractInstagram(cell)
          if (candidate) { instagram = candidate; break }
        }
      }

      records.push({
        nome,
        cidade:    iCidade >= 0 ? clean(row[iCidade]) : null,
        uf,
        whatsapp,
        site:      iSite   >= 0 ? clean(row[iSite])   : null,
        instagram,
      })
    }
  }

  return records
}
