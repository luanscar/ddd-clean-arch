import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'
import type { PollDTO } from '../dtos/poll.dto.js'
import { PollMapper } from '../mappers/poll.mapper.js'

export interface GetPollByIdQuery {
  id: UniqueEntityId
  tenantId?: string
}

export class GetPollByIdHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(query: GetPollByIdQuery): Promise<Result<PollDTO, DomainError>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(query.id, tenantId)

    if (!poll) {
      return R.fail(new NotFoundError('Poll', query.id.toString()))
    }

    return R.ok(PollMapper.instance.toDTO(poll))
  }
}
