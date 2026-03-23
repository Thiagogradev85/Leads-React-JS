import db from '../db/db.js'

export const SellerModel = {
  async list() {
    const { rows } = await db.query(`
      SELECT s.*,
             COALESCE(
               json_agg(su.uf ORDER BY su.uf) FILTER (WHERE su.uf IS NOT NULL),
               '[]'
             ) AS ufs
      FROM sellers s
      LEFT JOIN seller_ufs su ON su.seller_id = s.id
      GROUP BY s.id
      ORDER BY s.nome ASC
    `)
    return rows
  },

  async get(id) {
    const { rows } = await db.query(`
      SELECT s.*,
             COALESCE(
               json_agg(su.uf ORDER BY su.uf) FILTER (WHERE su.uf IS NOT NULL),
               '[]'
             ) AS ufs
      FROM sellers s
      LEFT JOIN seller_ufs su ON su.seller_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [id])
    return rows[0] || null
  },

  async create({ nome, whatsapp, ufs = [] }) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        'INSERT INTO sellers (nome, whatsapp) VALUES ($1, $2) RETURNING *',
        [nome, whatsapp]
      )
      const seller = rows[0]
      for (const uf of ufs) {
        await client.query(
          'INSERT INTO seller_ufs (seller_id, uf) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [seller.id, uf.toUpperCase()]
        )
      }
      await client.query('COMMIT')
      return this.get(seller.id)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async update(id, { nome, whatsapp, ativo, ufs }) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `UPDATE sellers
         SET nome     = COALESCE($1, nome),
             whatsapp = COALESCE($2, whatsapp),
             ativo    = COALESCE($3, ativo)
         WHERE id = $4`,
        [nome, whatsapp, ativo, id]
      )
      if (Array.isArray(ufs)) {
        await client.query('DELETE FROM seller_ufs WHERE seller_id = $1', [id])
        for (const uf of ufs) {
          await client.query(
            'INSERT INTO seller_ufs (seller_id, uf) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, uf.toUpperCase()]
          )
        }
      }
      await client.query('COMMIT')
      return this.get(id)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },

  async delete(id) {
    await db.query('DELETE FROM sellers WHERE id = $1', [id])
  },
}
