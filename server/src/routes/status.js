import { Router } from 'express'
import { StatusController } from '../controllers/StatusController.js'

const router = Router()

router.get('/',     StatusController.list)
router.get('/:id',  StatusController.get)
router.post('/',    StatusController.create)
router.put('/:id',  StatusController.update)
router.delete('/:id', StatusController.delete)

export default router
