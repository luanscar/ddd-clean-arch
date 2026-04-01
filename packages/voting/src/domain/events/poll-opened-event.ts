import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'

export class PollOpenedEvent extends DomainEvent {
  readonly eventName = 'VOTING.POLL_OPENED' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }
}
