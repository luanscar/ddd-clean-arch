import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { TallyResult } from '../value-objects/tally-result.js'

export class PollClosedEvent extends DomainEvent {
  readonly eventName = 'VOTING.POLL_CLOSED' as const

  constructor(
    public readonly pollId: UniqueEntityId,
    public readonly tenantId: TenantId,
    public readonly finalTally: TallyResult,
    readonly occurredOn: Date,
  ) {
    super(pollId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tenantId: this.tenantId.value,
      finalTally: this.finalTally,
    }
  }
}
