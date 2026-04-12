import { verifyToken } from '../utils/auth.js'
import { AppError }    from '../utils/AppError.js'

/**
 * Middleware de autenticação JWT.
 * Lê o token do cookie "token" ou do header Authorization: Bearer <token>.
 * Injeta req.user = { id, email, nome, role } se válido.
 */
export function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '')

    if (!token) throw new AppError('Não autenticado.', 401)

    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    next(new AppError('Sessão inválida ou expirada. Faça login novamente.', 401))
  }
}

/**
 * Middleware que exige role 'admin'.
 * Usar depois de requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Acesso restrito a administradores.', 403))
  }
  next()
}
