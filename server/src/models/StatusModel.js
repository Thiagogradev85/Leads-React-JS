import db from '../db/db.js'

export const StatusModel = {
  async list() {
    const { rows } = await db.query(
      'SELECT * FROM status ORDER BY ordem ASC'
    )
    return rows
  },

  async get(id) {
    const { rows } = await db.query(
      'SELECT * FROM status WHERE id = $1',
      [id]
    )
    return rows[0] || null
  },

  async create({ nome, cor = '#6b7280', ordem = 0 }) {
    const { rows } = await db.query(
      'INSERT INTO status (nome, cor, ordem) VALUES ($1, $2, $3) RETURNING *',
      [nome, cor, ordem]
    )
    return rows[0]
  },

  async update(id, { nome, cor, ordem }) {
    const { rows } = await db.query(
      `UPDATE status
       SET nome  = COALESCE($1, nome),
           cor   = COALESCE($2, cor),
           ordem = COALESCE($3, ordem)
       WHERE id = $4
       RETURNING *`,
      [nome, cor, ordem, id]
    )
    return rows[0] || null
  },

  async delete(id) {
    await db.query('DELETE FROM status WHERE id = $1', [id])
  },
}
