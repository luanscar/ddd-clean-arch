import { DomainError } from '@repo/shared-kernel'

export class TenantSuspendedError extends DomainError {
  readonly code = 'TENANT.SUSPENDED' as const

  constructor(tenantId: string) {
    super(`Tenant is suspended`, { tenantId })
  }
}
