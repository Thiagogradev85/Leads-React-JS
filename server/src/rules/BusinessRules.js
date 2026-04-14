/**
 * BusinessRules.js — Centralizador de regras de negócio do CRM
 *
 * OBJETIVO: ser a única fonte de verdade para validações e constantes de domínio.
 * Qualquer regra de negócio que hoje está espalhada em controllers, models ou
 * frontend deve migrar para cá ao longo do tempo.
 *
 * COMO USAR:
 *   import { BusinessRules } from '../rules/BusinessRules.js'
 *   BusinessRules.validateClientUF(uf)                 // lança AppError se inválida
 *   BusinessRules.isOverdue(client, days)               // retorna boolean
 *   const days = BusinessRules.NTI_COOLDOWN_DAYS        // constante
 *
 * STATUS: planejada em 2026-04-14 — migração incremental conforme novas features.
 * Controllers e models ainda contêm parte dessas validações — migrar ao refatorar.
 */

import { AppError } from '../utils/AppError.js'

// ─────────────────────────────────────────────────────────────
// Constantes de domínio
// ─────────────────────────────────────────────────────────────

/** UFs válidas do Brasil */
export const VALID_UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
])

/** Status excluídos do lembrete de atenção (sem contato há N dias) */
export const OVERDUE_EXCLUDED_STATUSES = new Set([
  'Fabricação Própria',
  'Exclusividade',
])

/** Dias de cooldown após "Não Tem Interesse" antes de voltar para Prospecção */
export const NTI_COOLDOWN_DAYS = 90

/** Nota automática para clientes sem WhatsApp e sem Instagram */
export const DEFAULT_NOTA_SEM_CONTATO = 1

// ─────────────────────────────────────────────────────────────
// Validações — lançam AppError se a regra for violada
// ─────────────────────────────────────────────────────────────

export const BusinessRules = {

  /**
   * UF obrigatória e válida para clientes criados/editados manualmente.
   * Importação pode criar clientes sem UF (fila laranja).
   */
  validateClientUF(uf) {
    if (!uf || !String(uf).trim()) {
      throw new AppError('UF é obrigatória.', 422)
    }
    if (!VALID_UFS.has(String(uf).trim().toUpperCase())) {
      throw new AppError(`UF inválida: "${uf}". Use a sigla de 2 letras (ex: SP, RJ).`, 422)
    }
  },

  /**
   * UF exclusiva por vendedor — nenhuma das UFs solicitadas pode estar
   * ocupada por outro vendedor do mesmo usuário.
   * @param {string[]} ufs - UFs desejadas
   * @param {string[]} takenUFs - UFs já ocupadas por outros vendedores
   */
  validateSellerUFsAvailable(ufs, takenUFs) {
    if (!ufs || ufs.length === 0) return
    const takenSet = new Set(takenUFs.map(u => u.toUpperCase()))
    const conflicts = ufs.map(u => u.toUpperCase()).filter(u => takenSet.has(u))
    if (conflicts.length > 0) {
      const err = new AppError(
        `UF(s) já atribuída(s) a outro vendedor: ${conflicts.join(', ')}`,
        409
      )
      err.conflicts = conflicts
      throw err
    }
  },

  /**
   * Nome obrigatório para clientes.
   */
  validateClientNome(nome) {
    if (!nome || !String(nome).trim()) {
      throw new AppError('Nome é obrigatório.', 422)
    }
  },

  // ─────────────────────────────────────────────────────────────
  // Lógica de domínio — retornam valores, não lançam erros
  // ─────────────────────────────────────────────────────────────

  /**
   * Determina se um cliente está em atraso de contato.
   * Exclui clientes criados hoje e status de encerramento.
   * @param {object} client - { created_at, ultimo_contato, status_nome }
   * @param {number} days - limiar em dias
   */
  isOverdue(client, days) {
    const thresholdMs = days * 24 * 60 * 60 * 1000
    const today = new Date().toLocaleDateString('en-CA')
    if (client.created_at?.slice(0, 10) === today) return false
    if (OVERDUE_EXCLUDED_STATUSES.has(client.status_nome)) return false
    const ref = client.ultimo_contato
      ? new Date(client.ultimo_contato).getTime()
      : new Date(client.created_at).getTime()
    return Date.now() - ref > thresholdMs
  },

  /**
   * Nota automática para clientes sem nenhum canal de contato.
   * Retorna 1 (nota baixa) se não houver WhatsApp nem Instagram.
   */
  defaultNota(whatsapp, instagram) {
    return !whatsapp && !instagram ? DEFAULT_NOTA_SEM_CONTATO : null
  },

  /**
   * Verifica se uma UF é válida (sem lançar erro).
   */
  isValidUF(uf) {
    return uf && VALID_UFS.has(String(uf).trim().toUpperCase())
  },
}
