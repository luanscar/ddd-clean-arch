import type { Result, IClock, UniqueEntityId } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import { Poll } from '../../domain/poll.js'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface CreatePollCommand {
  title: string
  allowedOptions: string[]
}

export class CreatePollHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
  ) {}

  async execute(command: CreatePollCommand): Promise<Result<UniqueEntityId, Error>> {
    if (!command.title || command.title.trim() === '') {
      return R.fail(new Error('Poll title cannot be empty'))
    }
    
    if (!command.allowedOptions || command.allowedOptions.length < 2) {
      return R.fail(new Error('Poll must have at least 2 options'))
    }

    const poll = Poll.create({
      title: command.title,
      allowedOptions: command.allowedOptions,
      now: this.clock.now(),
    })

    await this.pollRepository.save(poll)

    return R.ok(poll.id)
  }
}
