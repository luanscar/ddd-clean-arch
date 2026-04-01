import { DomainError } from './domain-error.js'

/**
 * NotFoundError — Erro disparado quando um agregado ou entidade
 * não é encontrado pelo identificador fornecido.
 *
 * @example
 *   return Result.fail(new NotFoundError('User', userId.toString()))
 */
export class NotFoundError extends DomainError {
  readonly code = 'SHARED.NOT_FOUND' as const

  constructor(
    /** Nome do recurso não encontrado (ex: 'User', 'Order'). */
    resourceName: string,
    /** Identificador que foi buscado. */
    identifier?: string,
    details?: unknown,
  ) {
    const identifierPart = identifier ? ` with id "${identifier}"` : ''
    super(`${resourceName}${identifierPart} was not found`, details)
  }
}
