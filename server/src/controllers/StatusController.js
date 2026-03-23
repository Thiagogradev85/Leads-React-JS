import { StatusModel } from '../models/StatusModel.js'

export const StatusController = {
  async list(req, res) {
    try {
      const data = await StatusModel.list()
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async get(req, res) {
    try {
      const data = await StatusModel.get(req.params.id)
      if (!data) return res.status(404).json({ error: 'Status não encontrado' })
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async create(req, res) {
    try {
      const data = await StatusModel.create(req.body)
      res.status(201).json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async update(req, res) {
    try {
      const data = await StatusModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ error: 'Status não encontrado' })
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async delete(req, res) {
    try {
      await StatusModel.delete(req.params.id)
      res.status(204).end()
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
}
