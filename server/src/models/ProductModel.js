import db from '../db/db.js'

// Converte string vazia ou undefined em null; para numéricos converte e valida
function cleanStr(v) { return (v === '' || v == null) ? null : String(v).trim() || null }
function cleanNum(v) {
  if (v === '' || v == null) return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

export const ProductModel = {
  async listByCatalog(catalog_id) {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE catalog_id = $1 ORDER BY tipo ASC, modelo ASC',
      [catalog_id]
    )
    return rows
  },

  async get(id) {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE id = $1', [id]
    )
    return rows[0] || null
  },

  async create(catalog_id, data) {
    const { rows } = await db.query(`
      INSERT INTO products
        (catalog_id, tipo, modelo, bateria, motor, velocidade_min, velocidade_max,
         pneu, suspensao, autonomia, carregador, peso, impermeabilidade,
         estoque, imagem, extra, preco)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [
      catalog_id,
      cleanStr(data.tipo),
      cleanStr(data.modelo),
      cleanStr(data.bateria),
      cleanStr(data.motor),
      cleanNum(data.velocidade_min),
      cleanNum(data.velocidade_max),
      cleanStr(data.pneu),
      cleanStr(data.suspensao),
      cleanStr(data.autonomia),
      cleanStr(data.carregador),
      cleanStr(data.peso),
      cleanStr(data.impermeabilidade),
      cleanNum(data.estoque) ?? 0,
      cleanStr(data.imagem),
      cleanStr(data.extra),
      cleanNum(data.preco),
    ])
    return rows[0]
  },

  async update(id, data) {
    const { rows } = await db.query(`
      UPDATE products SET
        tipo             = $1,
        modelo           = $2,
        bateria          = $3,
        motor            = $4,
        velocidade_min   = $5,
        velocidade_max   = $6,
        pneu             = $7,
        suspensao        = $8,
        autonomia        = $9,
        carregador       = $10,
        peso             = $11,
        impermeabilidade = $12,
        estoque          = $13,
        imagem           = $14,
        extra            = $15,
        preco            = $16,
        updated_at       = NOW()
      WHERE id = $17
      RETURNING *
    `, [
      cleanStr(data.tipo),
      cleanStr(data.modelo),
      cleanStr(data.bateria),
      cleanStr(data.motor),
      cleanNum(data.velocidade_min),
      cleanNum(data.velocidade_max),
      cleanStr(data.pneu),
      cleanStr(data.suspensao),
      cleanStr(data.autonomia),
      cleanStr(data.carregador),
      cleanStr(data.peso),
      cleanStr(data.impermeabilidade),
      cleanNum(data.estoque) ?? 0,
      cleanStr(data.imagem),
      cleanStr(data.extra),
      cleanNum(data.preco),
      id,
    ])
    return rows[0] || null
  },

  async updateStock(id, estoque) {
    const { rows } = await db.query(
      'UPDATE products SET estoque = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [estoque, id]
    )
    return rows[0] || null
  },

  async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id])
  },
}
