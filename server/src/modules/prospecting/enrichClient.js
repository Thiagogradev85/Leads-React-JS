import Anthropic from '@anthropic-ai/sdk'
import { searchWeb } from './serper.js'

const SYSTEM_PROMPT = `Você é um assistente especializado em enriquecimento de dados de empresas brasileiras.
Receberá resultados de busca do Google sobre uma empresa e deve extrair dados de contato estruturados.
Responda APENAS com JSON válido, sem texto adicional, sem markdown, sem blocos de código.

Formato obrigatório:
{
  "instagram": "handle sem @, ex: loja_exemplo (null se não encontrar)",
  "facebook": "URL completa ou apenas o slug, ex: lojaexemplo (null se não encontrar)",
  "email": "email@dominio.com (null se não encontrar)",
  "whatsapp": "somente dígitos com DDD, ex: 41999990000 (null se não encontrar)",
  "telefone": "somente dígitos com DDD, ex: 4133330000 (null se não encontrar)"
}

Regras:
- instagram: extraia apenas o handle (sem @, sem instagram.com/)
- facebook: extraia apenas o slug/caminho final (sem facebook.com/)
- whatsapp: prefira números de celular (9 dígitos após DDD). Remova +55, espaços, traços e parênteses
- telefone: prefira números fixos (8 dígitos após DDD). Remova +55, espaços, traços e parênteses
- Se encontrar apenas um número e não souber se é whatsapp ou fixo, coloque em whatsapp
- email: apenas endereços reais, ignore noreply@, suporte@ genéricos de plataformas
- Se um campo não for encontrado nos resultados, retorne null
- Nunca invente dados que não estejam nos resultados fornecidos`

/**
 * Enriquecer dados de um cliente usando busca web + Claude.
 *
 * @param {{ id, nome, cidade, uf, whatsapp, telefone, email, instagram, facebook }} client
 * @returns {{ instagram, facebook, email, whatsapp, telefone }} — apenas campos encontrados e ausentes no cliente
 */
export async function enrichClient(client) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY não configurada no servidor.')
  }

  const query = [client.nome, client.cidade, client.uf, 'instagram email contato'].filter(Boolean).join(' ')

  const { organic } = await searchWeb(query)

  if (!organic.length) return {}

  // Monta contexto resumido dos resultados para o Claude
  const searchContext = organic.slice(0, 8).map((r, i) => {
    const parts = [`[${i + 1}] ${r.title || ''}`]
    if (r.link)    parts.push(`URL: ${r.link}`)
    if (r.snippet) parts.push(`Trecho: ${r.snippet}`)
    if (r.sitelinks) {
      const links = r.sitelinks.map(s => s.link || s.title).filter(Boolean)
      if (links.length) parts.push(`Links: ${links.join(' | ')}`)
    }
    return parts.join('\n')
  }).join('\n\n')

  const userMessage = `Empresa: ${client.nome}
Cidade: ${client.cidade || '—'} / ${client.uf || '—'}

Resultados de busca:
${searchContext}`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let raw
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    raw = msg.content[0]?.text?.trim() || '{}'
  } catch (err) {
    throw new Error(`Claude enrich error: ${err.message}`)
  }

  let extracted = {}
  try { extracted = JSON.parse(raw) } catch { return {} }

  // Retorna apenas os campos que o cliente ainda não tem
  const result = {}
  for (const field of ['instagram', 'facebook', 'email', 'whatsapp', 'telefone']) {
    if (extracted[field] && !client[field]) {
      result[field] = extracted[field]
    }
  }

  return result
}
