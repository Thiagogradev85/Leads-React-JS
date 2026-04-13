import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom }           from '@hapi/boom'
import qrcode             from 'qrcode'
import { useDbAuthState, clearDbSession } from './dbAuthState.js'

class WhatsAppService {
  constructor(userId) {
    this.userId          = String(userId)
    this.sock            = null
    this.qrCodeBase64    = null
    this.status          = 'disconnected' // 'disconnected' | 'connecting' | 'connected'
    this.phone           = null
    this.error           = null
    this._reconnectAttempts = 0
    this._listeners      = {}
  }

  static MAX_RECONNECT = 3

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(fn)
  }

  emit(event, data) {
    ;(this._listeners[event] || []).forEach(fn => fn(data))
  }

  async connect() {
    if (this.status === 'connected') return
    this.status = 'connecting'
    this.qrCodeBase64 = null
    this.error = null
    this._reconnectAttempts = 0
    await this._doConnect()
  }

  async _doConnect() {
    let authState, saveCreds, version
    try {
      ;({ state: authState, saveCreds } = await useDbAuthState(this.userId))
      ;({ version } = await fetchLatestBaileysVersion())
    } catch (err) {
      console.error(`[WhatsApp:${this.userId}] Falha ao inicializar conexão:`, err.message)
      this.status = 'disconnected'
      this.error  = `Falha ao iniciar conexão: ${err.message}`
      return
    }

    this.sock = makeWASocket({
      version,
      auth: {
        creds: authState.creds,
        keys:  makeCacheableSignalKeyStore(authState.keys, console),
      },
      printQRInTerminal: false,
      browser: ['CRM', 'Chrome', '1.0'],
    })

    this.sock.ev.on('creds.update', saveCreds)

    this.sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        this.qrCodeBase64 = await qrcode.toDataURL(qr)
        this.emit('qr', this.qrCodeBase64)
      }

      if (connection === 'open') {
        this.status       = 'connected'
        this.qrCodeBase64 = null
        this.phone        = this.sock.user?.id?.split(':')[0] || null
        console.log(`[WhatsApp:${this.userId}] Conectado como`, this.phone)
        this.emit('connected', { phone: this.phone })
      }

      if (connection === 'close') {
        const boom      = new Boom(lastDisconnect?.error)
        const code      = boom?.output?.statusCode
        const loggedOut = code === DisconnectReason.loggedOut
        const errMsg    = lastDisconnect?.error?.message || null
        console.log(`[WhatsApp:${this.userId}] Desconectado — código: ${code} loggedOut: ${loggedOut}`, errMsg ?? '')
        this.status = 'disconnected'
        this.phone  = null
        this.emit('disconnected', { code })

        if (loggedOut) {
          this.error = 'Sessão encerrada pelo WhatsApp. Clique em "Limpar sessão" e reconecte.'
        } else {
          this._reconnectAttempts++
          if (this._reconnectAttempts <= WhatsAppService.MAX_RECONNECT) {
            console.log(`[WhatsApp:${this.userId}] Reconectando ${this._reconnectAttempts}/${WhatsAppService.MAX_RECONNECT}...`)
            setTimeout(() => {
              this.status = 'connecting'
              this.error  = null
              this._doConnect()
            }, 3000)
          } else {
            this.error = `Falha ao conectar após ${WhatsAppService.MAX_RECONNECT} tentativas. ${errMsg || `código ${code}`}`
          }
        }
      }
    })
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout().catch(() => {})
      this.sock = null
    }
    this.status       = 'disconnected'
    this.phone        = null
    this.qrCodeBase64 = null
    this.error        = null
    this._reconnectAttempts = 0
    this.emit('disconnected', { code: 'manual' })
  }

  async clearSession() {
    // Para conexão sem reconectar
    if (this.sock) {
      this.sock.ev.removeAllListeners()
      await this.sock.ws?.close?.()
      this.sock = null
    }
    this.status       = 'disconnected'
    this.phone        = null
    this.qrCodeBase64 = null
    this.error        = null
    this._reconnectAttempts = 0
    // Remove sessão do banco em vez do filesystem
    await clearDbSession(this.userId)
  }

  getStatus() {
    return {
      status:  this.status,
      phone:   this.phone,
      qrCode:  this.qrCodeBase64,
      error:   this.error,
    }
  }

  async sendText(number, text) {
    if (this.status !== 'connected') throw new Error('WhatsApp não está conectado.')
    const jid = number.replace(/\D/g, '') + '@s.whatsapp.net'
    await this.sock.sendMessage(jid, { text })
  }

  async sendBulk({ clients, message, delayMs = 5000, onProgress, onSent }) {
    if (this.status !== 'connected') throw new Error('WhatsApp não está conectado.')

    const results = { sent: 0, failed: 0, errors: [] }

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]
      try {
        const text = message
          .replace(/\{\{nome\}\}/gi,   client.nome   || '')
          .replace(/\{\{cidade\}\}/gi, client.cidade || '')
          .replace(/\{\{uf\}\}/gi,     client.uf     || '')

        await this.sendText(client.whatsapp, text)
        results.sent++
        console.log(`[WhatsApp:${this.userId}] Enviado para ${client.nome} (${client.whatsapp})`)
        if (onSent) await onSent(client)
      } catch (err) {
        results.failed++
        results.errors.push({ nome: client.nome, whatsapp: client.whatsapp, error: err.message })
        console.error(`[WhatsApp:${this.userId}] Erro ao enviar para ${client.nome}:`, err.message)
      }

      if (onProgress) onProgress({ current: i + 1, total: clients.length, results })

      if (i < clients.length - 1) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }

    return results
  }
}

// ── Instâncias por usuário ────────────────────────────────────────────────────

const _instances = new Map()

/**
 * Retorna (ou cria) a instância do WhatsAppService para um usuário.
 * Cada usuário tem sua própria conexão e sessão isoladas.
 */
export function getWhatsAppService(userId) {
  const key = String(userId)
  if (!_instances.has(key)) _instances.set(key, new WhatsAppService(key))
  return _instances.get(key)
}
