import type { UniqueEntityId, PaginatedDTO, TenantId, IRepository } from '@repo/shared-kernel'
import type { Poll } from '../poll.js'

export interface FindPollsParams {
  page: number
  limit: number
  status?: string
  tenantId: TenantId
}

/**
 * IPollRepository — Interface de repositório para o agregado Poll.
 * Estende o contrato genérico IRepository para garantir consistência em Multi-Tenancy.
 */
export interface IPollRepository extends IRepository<Poll, UniqueEntityId> {
  /**
   * Busca Sessões de Votação (Polls) paginadas dentro de um Tenant específico.
   */
  findMany(params: FindPollsParams): Promise<PaginatedDTO<Poll>>
}
