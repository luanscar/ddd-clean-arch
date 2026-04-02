import type { Result, IClock, UniqueEntityId, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
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

  async execute(command: CreatePollCommand): Promise<Result<UniqueEntityId, Error>> {
    if (!command.title || command.title.trim() === '') {
      return R.fail(new Error('Poll title cannot be empty'))
    }
    
    if (!command.allowedOptions || command.allowedOptions.length < 2) {
      return R.fail(new Error('Poll must have at least 2 options'))
    }

    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const poll = Poll.create({
      title: command.title,
      allowedOptions: command.allowedOptions,
      tenantId,
      now: this.clock.now(),
    })

    await this.pollRepository.save(poll)
    await this.eventDispatcher.dispatchAll(poll.pullDomainEvents())

    return R.ok(poll.id)
  }
}
