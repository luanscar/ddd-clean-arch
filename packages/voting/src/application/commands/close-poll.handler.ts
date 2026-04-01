import type { Result, IClock, UniqueEntityId, DomainError } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import type { TallyResult } from '../../domain/value-objects/tally-result.js'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface ClosePollCommand {
  pollId: UniqueEntityId
}

export class ClosePollHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
  ) {}

  async execute(command: ClosePollCommand): Promise<Result<TallyResult, DomainError | Error>> {
    const poll = await this.pollRepository.findById(command.pollId)

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
