import type { Result, IClock, UniqueEntityId, DomainError, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface OpenPollCommand {
  pollId: UniqueEntityId
  tenantId?: string
}

export class OpenPollHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: OpenPollCommand): Promise<Result<void, DomainError | Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(command.pollId, tenantId)

    if (!poll) {
      return R.fail(new Error(`Poll with id ${command.pollId.toString()} not found`))
    }

    const result = poll.open(this.clock.now())

    if (!result.ok) {
      return R.fail(result.error)
    }

    await this.pollRepository.save(poll)
    await this.eventDispatcher.dispatchAll(poll.pullDomainEvents())

    return R.ok(undefined)
  }
}
