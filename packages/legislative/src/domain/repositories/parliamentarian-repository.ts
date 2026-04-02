import type { IRepository, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { Parliamentarian } from '../parliamentarian.js'

export interface IParliamentarianRepository extends IRepository<Parliamentarian, UniqueEntityId> {
  findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null>
}
