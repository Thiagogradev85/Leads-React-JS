import bcrypt from 'bcryptjs'
import jwt    from 'jsonwebtoken'

const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme-jwt-secret'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d'

export const hashPassword   = (plain)  => bcrypt.hash(plain, 10)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}
