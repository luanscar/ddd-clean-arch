import type { IRepository, UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import type { DeliberativeSession } from '../deliberative-session.js'

export interface FindDeliberativeSessionsParams {
  tenantId: TenantId
  page?: number
  limit?: number
}

export interface IDeliberativeSessionRepository extends IRepository<DeliberativeSession, UniqueEntityId> {
  findMany(params: FindDeliberativeSessionsParams): Promise<PaginatedDTO<DeliberativeSession>>
}
