import type { Result, IClock, UniqueEntityId, DomainError, ITenantProvider } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
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
  ) {}

  async execute(command: CastVoteCommand): Promise<Result<void, DomainError | Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = await this.pollRepository.findById(command.pollId, tenantId)

    if (!poll) {
      return R.fail(new Error(`Poll with id ${command.pollId.toString()} not found`))
    }

    const voteResult = poll.castVote(command.voterId, command.optionRaw, this.clock.now())

    if (!voteResult.ok) {
      return R.fail(voteResult.error)
    }

    await this.pollRepository.save(poll)

    return R.ok(undefined)
  }
}
