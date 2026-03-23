/**
 * Erro de aplicação com statusCode HTTP.
 * Use para erros previsíveis (validação, not found, regra de negócio).
 * Erros inesperados são tratados pelo middleware global com status 500.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}
