import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'

export class PropositionSubmittedEvent extends DomainEvent {
  readonly eventName = 'LEGISLATIVE.PROPOSITION_SUBMITTED' as const

  constructor(
    public readonly propositionId: UniqueEntityId,
    public readonly authorId: UniqueEntityId,
    public readonly title: string,
    public readonly description: string,
    readonly occurredOn: Date,
  ) {
    super(propositionId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      authorId: this.authorId.toString(),
      title: this.title,
      description: this.description,
    }
  }
}
