import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { Parliamentarian } from '../../domain/parliamentarian.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface GetParliamentarianQuery {
  parliamentarianId: UniqueEntityId
  tenantId?: string
  /** Admin / plenary_operator podem ver mandato inativo; outros recebem 404. MVP-05. */
  allowInactive?: boolean
}

export class GetParliamentarianHandler {
  constructor(
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(q: GetParliamentarianQuery): Promise<Result<Parliamentarian, DomainError>> {
    const tenantId = q.tenantId ? TenantId.reconstruct(q.tenantId) : this.tenantProvider.getTenantId()

    const p = await this.parliamentarianRepository.findById(q.parliamentarianId, tenantId)
    if (!p) {
      return R.fail(new NotFoundError('Parliamentarian', q.parliamentarianId.toString()))
    }
    if (!p.isActive() && !q.allowInactive) {
      return R.fail(new NotFoundError('Parliamentarian', q.parliamentarianId.toString()))
    }
    return R.ok(p)
  }
}
