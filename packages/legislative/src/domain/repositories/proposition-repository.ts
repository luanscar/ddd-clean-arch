import type { IRepository, UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import type { Proposition } from '../proposition.js'
import type { PropositionStatus } from '../value-objects/proposition-status.js'

export interface FindPropositionsParams {
  tenantId: TenantId
  status?: PropositionStatus
  authorId?: UniqueEntityId
  page?: number
  limit?: number
}

export interface IPropositionRepository extends IRepository<Proposition, UniqueEntityId> {
  findMany(params: FindPropositionsParams): Promise<PaginatedDTO<Proposition>>
  findByPollId(pollId: UniqueEntityId, tenantId: TenantId): Promise<Proposition | null>
}
