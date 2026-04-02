import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'

export class PropositionFinalizedEvent extends DomainEvent {
  readonly eventName = 'LEGISLATIVE.PROPOSITION_FINALIZED' as const

  constructor(
    public readonly propositionId: UniqueEntityId,
    public readonly approved: boolean,
    readonly occurredOn: Date,
  ) {
    super(propositionId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      approved: this.approved,
    }
  }
}
