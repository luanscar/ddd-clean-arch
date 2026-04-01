import type { Result, IClock, UniqueEntityId, DomainError, ITenantProvider } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
import type { TallyResult } from '../../domain/value-objects/tally-result.js'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface ClosePollCommand {
  pollId: UniqueEntityId
  tenantId?: string
}

export class ClosePollHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: ClosePollCommand): Promise<Result<TallyResult, DomainError | Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(command.pollId, tenantId)

    if (!poll) {
      return R.fail(new Error(`Poll with id ${command.pollId.toString()} not found`))
    }

    const result = poll.close(this.clock.now())

    if (!result.ok) {
      return R.fail(result.error)
    }

    await this.pollRepository.save(poll)

    return R.ok(result.value)
  }
}
