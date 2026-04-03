import type { TenantId } from '@repo/shared-kernel'
import type { Tenant } from '../../domain/tenant.js'
import type { ITenantRepository } from '../../domain/repositories/tenant-repository.js'

/**
 * Repositório em memória para testes e arranques sem tabela `tenants` no Prisma.
 */
export class InMemoryTenantRepository implements ITenantRepository {
  private readonly items = new Map<string, Tenant>()

  async findById(id: TenantId): Promise<Tenant | null> {
    return this.items.get(id.toString()) ?? null
  }

  async save(tenant: Tenant): Promise<void> {
    this.items.set(tenant.id.toString(), tenant)
  }

  clear(): void {
    this.items.clear()
  }
}
