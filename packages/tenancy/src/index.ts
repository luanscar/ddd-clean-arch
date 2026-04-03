// Domain
export { Tenant } from './domain/tenant.js'
export { TenantStatus, type TenantStatusValue } from './domain/tenant-status.js'

// Domain — ports
export type { ITenantRepository } from './domain/repositories/tenant-repository.js'

// Application — queries
export type { GetTenantQuery } from './application/queries/get-tenant.query.js'
export { GetTenantHandler } from './application/queries/get-tenant.handler.js'

// Domain — errors
export { TenantSuspendedError } from './domain/errors/tenant-suspended-error.js'

// Utilitário de domínio (validação de status na persistência)
export { isTenantStatusValue } from './domain/tenant-status.js'
