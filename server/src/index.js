import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import statusRoutes      from './routes/status.js'
import sellerRoutes      from './routes/sellers.js'
import clientRoutes      from './routes/clients.js'
import catalogRoutes     from './routes/catalogs.js'
import dailyReportRoutes from './routes/dailyReport.js'
import { AppError }      from './utils/AppError.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Rotas ──────────────────────────────────────────
app.use('/status',       statusRoutes)
app.use('/sellers',      sellerRoutes)
app.use('/clients',      clientRoutes)
app.use('/catalogs',     catalogRoutes)
app.use('/daily-report', dailyReportRoutes)

// ── Health check ───────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))

// ── Middleware global de erros ──────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  console.error('[Erro inesperado]', err)
  res.status(500).json({ error: 'Erro interno do servidor. Verifique os logs.' })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
})
