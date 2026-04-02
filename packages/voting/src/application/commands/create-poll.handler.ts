import type {
  Result,
  IClock,
  UniqueEntityId,
  ITenantProvider,
  IDomainEventDispatcher,
  DomainError,
} from '@repo/shared-kernel'
import { Result as R, TenantId, ValidationError } from '@repo/shared-kernel'
import { Poll } from '../../domain/poll.js'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'

export interface CreatePollCommand {
  title: string
  allowedOptions: string[]
  tenantId?: string
}

export class CreatePollHandler {
  constructor(
    private readonly pollRepository: IPollRepository,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: CreatePollCommand): Promise<Result<UniqueEntityId, DomainError>> {
    if (!command.title || command.title.trim() === '') {
      return R.fail(new ValidationError('Poll title cannot be empty'))
    }

    if (!command.allowedOptions || command.allowedOptions.length < 2) {
      return R.fail(new ValidationError('Poll must have at least 2 options'))
    }

    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const pollResult = Poll.create({
      title: command.title,
      allowedOptions: command.allowedOptions,
      tenantId,
      now: this.clock.now(),
    })
    if (!pollResult.ok) {
      return R.fail(pollResult.error)
    }
    const poll = pollResult.value

    await this.pollRepository.save(poll)
    await this.eventDispatcher.dispatchAll(poll.pullDomainEvents())

    return R.ok(poll.id)
  }
}
