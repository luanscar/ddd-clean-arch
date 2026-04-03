import { DomainError } from '@repo/shared-kernel'

/**
 * Impede retirar o último administrador ativo do inquilino (MVP-06).
 */
export class LastTenantAdminError extends DomainError {
  readonly code = 'IDENTITY.LAST_TENANT_ADMIN' as const

  constructor() {
    super('Cannot remove or demote the last active tenant administrator')
  }
}
