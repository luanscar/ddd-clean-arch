import type { Result, IClock, UniqueEntityId, DomainError, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
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
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: ClosePollCommand): Promise<Result<TallyResult, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(command.pollId, tenantId)

    if (!poll) {
      return R.fail(new NotFoundError('Poll', command.pollId.toString()))
    }

    const result = poll.close(this.clock.now())

    if (!result.ok) {
      return R.fail(result.error)
    }

    await this.pollRepository.save(poll)
    await this.eventDispatcher.dispatchAll(poll.pullDomainEvents())

    return R.ok(result.value)
  }
}
