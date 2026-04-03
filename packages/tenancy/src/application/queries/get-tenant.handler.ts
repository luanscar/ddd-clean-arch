import type { Result, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, NotFoundError } from '@repo/shared-kernel'
import type { Tenant } from '../../domain/tenant.js'
import type { ITenantRepository } from '../../domain/repositories/tenant-repository.js'
import type { GetTenantQuery } from './get-tenant.query.js'

/**
 * Verifica se o inquilino existe e está acessível para o contexto atual.
 * Útil para validação na borda HTTP antes de operações multi-contexto.
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
    return R.ok(tenant)
  }
}
