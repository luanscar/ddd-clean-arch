import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId } from '@repo/shared-kernel'

/**
 * UserDeactivatedEvent — emitido quando um usuário é desativado.
 *
 * Consumidores típicos:
 *  - Revogação de sessões ativas
 *  - Notificação de segurança
 *  - Auditoria
 */
export class UserDeactivatedEvent extends DomainEvent {
  readonly eventName = 'IDENTITY.USER_DEACTIVATED' as const

  constructor(aggregateId: UniqueEntityId) {
    super(aggregateId)
  }
}
