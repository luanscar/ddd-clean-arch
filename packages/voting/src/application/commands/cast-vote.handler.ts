import type {
  Result,
  IClock,
  UniqueEntityId,
  DomainError,
  ITenantProvider,
  IDomainEventDispatcher,
} from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface CastVoteCommand {
  pollId: UniqueEntityId
  voterId: UniqueEntityId
  optionRaw: string
  tenantId?: string
}

export class CastVoteHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: CastVoteCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(command.pollId, tenantId)

    if (!poll) {
      return R.fail(new NotFoundError('Poll', command.pollId.toString()))
    }

    const voteResult = poll.castVote(command.voterId, command.optionRaw, this.clock.now())

    if (!voteResult.ok) {
      return R.fail(voteResult.error)
    }

    await this.pollRepository.save(poll)
    await this.eventDispatcher.dispatchAll(poll.pullDomainEvents())

    return R.ok(undefined)
  }
}
