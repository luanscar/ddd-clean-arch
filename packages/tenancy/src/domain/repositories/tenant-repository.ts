import type { TenantId } from '@repo/shared-kernel'
import type { Tenant } from '../tenant.js'

export interface ITenantRepository {
  findById(id: TenantId): Promise<Tenant | null>
  save(tenant: Tenant): Promise<void>
}
