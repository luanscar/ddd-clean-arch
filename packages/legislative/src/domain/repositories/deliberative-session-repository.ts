import type { IRepository, UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import type { DeliberativeSession } from '../deliberative-session.js'

export interface FindDeliberativeSessionsParams {
  tenantId: TenantId
  page?: number
  limit?: number
}

export interface IDeliberativeSessionRepository extends IRepository<DeliberativeSession, UniqueEntityId> {
  findMany(params: FindDeliberativeSessionsParams): Promise<PaginatedDTO<DeliberativeSession>>

  /**
   * MVP-08 / MVP-01: existe item de pauta VOTABLE_PROPOSITION com esta proposição no inquilino.
   */
  hasVotableAgendaItemForProposition(
    tenantId: TenantId,
    propositionId: UniqueEntityId,
  ): Promise<boolean>
}
