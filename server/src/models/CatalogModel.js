import db from '../db/db.js'

export const CatalogModel = {
  async list() {
    const { rows } = await db.query(`
      SELECT c.*, COUNT(p.id)::int AS total_products
      FROM catalogs c
      LEFT JOIN products p ON p.catalog_id = c.id
      GROUP BY c.id
      ORDER BY c.data DESC
    `)
    return rows
  },

  async get(id) {
    const { rows } = await db.query(
      'SELECT * FROM catalogs WHERE id = $1', [id]
    )
    return rows[0] || null
  },

  async create({ nome, data }) {
    const { rows } = await db.query(
      'INSERT INTO catalogs (nome, data) VALUES ($1, $2) RETURNING *',
      [nome, data]
    )
    return rows[0]
  },

  async update(id, { nome, data, ativo }) {
    const { rows } = await db.query(`
      UPDATE catalogs SET
        nome  = COALESCE($1, nome),
        data  = COALESCE($2, data),
        ativo = COALESCE($3, ativo)
      WHERE id = $4
      RETURNING *
    `, [nome, data, ativo, id])
    return rows[0] || null
  },

  async delete(id) {
    await db.query('DELETE FROM catalogs WHERE id = $1', [id])
  },
}
