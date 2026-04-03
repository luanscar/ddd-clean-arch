import type { Result, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, NotFoundError } from '@repo/shared-kernel'
import { TenantSuspendedError } from '../../domain/errors/tenant-suspended-error.js'
import type { Tenant } from '../../domain/tenant.js'
import type { ITenantRepository } from '../../domain/repositories/tenant-repository.js'
import type { GetTenantQuery } from './get-tenant.query.js'

/**
 * Resolve o inquilino do contexto (ou o indicado na query), garante que existe
 * na persistência e que está operacional (não suspenso).
 */
export class GetTenantHandler {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(q: GetTenantQuery): Promise<Result<Tenant, DomainError>> {
    const tenantId = q.tenantId ?? this.tenantProvider.getTenantId()
    const tenant = await this.tenantRepository.findById(tenantId)
    if (!tenant) {
      return R.fail(new NotFoundError('Tenant', tenantId.toString()))
    }
    if (!tenant.isOperational()) {
      return R.fail(new TenantSuspendedError(tenantId.toString()))
    }
    return R.ok(tenant)
  }
}
