import { Router } from 'express'
import { DailyReportController } from '../controllers/DailyReportController.js'

const router = Router()

router.get('/summary', DailyReportController.getSummary)
router.get('/details', DailyReportController.getDetails)
router.get('/dates',   DailyReportController.listDates)
router.get('/pdf',     DailyReportController.downloadPdf)

export default router
