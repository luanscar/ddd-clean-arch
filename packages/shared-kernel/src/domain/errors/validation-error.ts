import { DomainError } from './domain-error.js'

/**
 * ValidationError — Erro disparado quando invariantes de domínio são violadas.
 *
 * @example
 *   throw new ValidationError('Email inválido', { field: 'email', value: raw })
 */
export class ValidationError extends DomainError {
  readonly code = 'SHARED.VALIDATION_ERROR' as const

  constructor(message: string, details?: unknown) {
    super(message, details)
  }
}
