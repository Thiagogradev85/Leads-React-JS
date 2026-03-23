import { SellerModel } from '../models/SellerModel.js'

export const SellerController = {
  async list(req, res) {
    try {
      const data = await SellerModel.list()
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async get(req, res) {
    try {
      const data = await SellerModel.get(req.params.id)
      if (!data) return res.status(404).json({ error: 'Vendedor não encontrado' })
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async create(req, res) {
    try {
      const data = await SellerModel.create(req.body)
      res.status(201).json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async update(req, res) {
    try {
      const data = await SellerModel.update(req.params.id, req.body)
      if (!data) return res.status(404).json({ error: 'Vendedor não encontrado' })
      res.json(data)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },

  async delete(req, res) {
    try {
      await SellerModel.delete(req.params.id)
      res.status(204).end()
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  },
}
