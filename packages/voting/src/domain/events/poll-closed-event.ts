import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'
import type { TallyResult } from '../value-objects/tally-result.js'

export class PollClosedEvent extends DomainEvent {
  readonly eventName = 'VOTING.POLL_CLOSED' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    public readonly finalTally: TallyResult,
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      finalTally: this.finalTally,
    }
  }
}
