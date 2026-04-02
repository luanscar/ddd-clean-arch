import type { ITenantProvider, PaginatedDTO } from '@repo/shared-kernel'
import { TenantId } from '@repo/shared-kernel'
import type { Parliamentarian } from '../../domain/parliamentarian.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface ListParliamentariansQuery {
  tenantId?: string
  page?: number
  limit?: number
}

export class ListParliamentariansHandler {
  constructor(
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(query: ListParliamentariansQuery): Promise<PaginatedDTO<Parliamentarian>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    return this.parliamentarianRepository.findMany({
      tenantId,
      page: query.page,
      limit: query.limit,
    })
  }
}
