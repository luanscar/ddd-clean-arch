import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'
import type { ParliamentaryRole } from '../value-objects/parliamentary-role.js'

export class ParliamentarianRegisteredEvent extends DomainEvent {
  readonly eventName = 'LEGISLATIVE.PARLIAMENTARIAN_REGISTERED' as const

  constructor(
    public readonly parliamentarianId: UniqueEntityId,
    public readonly userId: UniqueEntityId,
    public readonly name: string,
    public readonly role: ParliamentaryRole,
    readonly occurredOn: Date,
  ) {
    super(parliamentarianId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      userId: this.userId.value,
      name: this.name,
      role: this.role.value,
    }
  }
}
