import type { ITenantProvider, PaginatedDTO } from '@repo/shared-kernel'
import { TenantId } from '@repo/shared-kernel'
import type { DeliberativeSession } from '../../domain/deliberative-session.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface ListDeliberativeSessionsQuery {
  tenantId?: string
  page?: number
  limit?: number
}

export class ListDeliberativeSessionsHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(query: ListDeliberativeSessionsQuery): Promise<PaginatedDTO<DeliberativeSession>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    return this.sessionRepository.findMany({
      tenantId,
      page: query.page,
      limit: query.limit,
    })
  }
}
