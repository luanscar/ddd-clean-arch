import type { IRepository, UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import type { Parliamentarian } from '../parliamentarian.js'

export interface FindParliamentariansParams {
  tenantId: TenantId
  page?: number
  limit?: number
}

export interface IParliamentarianRepository extends IRepository<Parliamentarian, UniqueEntityId> {
  findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null>
  findMany(params: FindParliamentariansParams): Promise<PaginatedDTO<Parliamentarian>>
}
