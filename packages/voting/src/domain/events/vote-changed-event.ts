import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'
import type { PollOption } from '../value-objects/poll-option.js'

export class VoteChangedEvent extends DomainEvent {
  readonly eventName = 'VOTING.VOTE_CHANGED' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    public readonly voterId: UniqueEntityId,
    public readonly previousOption: PollOption,
    public readonly newOption: PollOption,
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      voterId: this.voterId.toString(),
      previousOption: this.previousOption,
      newOption: this.newOption,
    }
  }
}
