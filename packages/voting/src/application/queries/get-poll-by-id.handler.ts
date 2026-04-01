import type { Result, UniqueEntityId, ITenantProvider } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
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

  async execute(query: GetPollByIdQuery): Promise<Result<PollDTO, Error>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(query.id, tenantId)

    if (!poll) {
      return R.fail(new Error(`Poll with id ${query.id.toString()} not found`))
    }

    return R.ok(PollMapper.instance.toDTO(poll))
  }
}
