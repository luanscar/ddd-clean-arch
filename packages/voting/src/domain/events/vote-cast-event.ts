import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'
import type { PollOption } from '../value-objects/poll-option.js'

export class VoteCastEvent extends DomainEvent {
  readonly eventName = 'VOTING.VOTE_CAST' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    public readonly voterId: UniqueEntityId,
    public readonly option: PollOption,
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      voterId: this.voterId.toString(),
      option: this.option,
    }
  }
}
