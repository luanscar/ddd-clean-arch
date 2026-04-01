import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'
import type { PollOption } from '../value-objects/poll-option.js'

export class PollCreatedEvent extends DomainEvent {
  readonly eventName = 'VOTING.POLL_CREATED' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    public readonly title: string,
    public readonly allowedOptions: PollOption[],
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      title: this.title,
      allowedOptions: this.allowedOptions,
    }
  }
}
