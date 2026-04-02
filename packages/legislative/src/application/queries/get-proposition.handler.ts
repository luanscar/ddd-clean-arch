import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { Proposition } from '../../domain/proposition.js'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'

export interface GetPropositionQuery {
  propositionId: UniqueEntityId
  tenantId?: string
}

export class GetPropositionHandler {
  constructor(
    private readonly propositionRepository: IPropositionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(q: GetPropositionQuery): Promise<Result<Proposition, DomainError>> {
    const tenantId = q.tenantId ? TenantId.reconstruct(q.tenantId) : this.tenantProvider.getTenantId()

    const prop = await this.propositionRepository.findById(q.propositionId, tenantId)
    if (!prop) {
      return R.fail(new NotFoundError('Proposition', q.propositionId.toString()))
    }
    return R.ok(prop)
  }
}
