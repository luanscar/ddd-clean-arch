import { DomainError } from './domain-error.js'

/**
 * ConflictError — Erro disparado quando uma operação violaria uma regra
 * de unicidade ou exclusividade (ex: e-mail já cadastrado, slug duplicado).
 *
 * @example
 *   return Result.fail(new ConflictError('User', 'email', email.value))
 */
export class ConflictError extends DomainError {
  readonly code = 'SHARED.CONFLICT' as const

  constructor(
    /** Nome do recurso em conflito. */
    resourceName: string,
    /** Campo que causou o conflito. */
    field?: string,
    /** Valor conflitante. */
    value?: unknown,
    details?: unknown,
  ) {
    const fieldPart = field ? ` with ${field} "${String(value)}"` : ''
    super(`${resourceName}${fieldPart} already exists`, details)
  }
}
