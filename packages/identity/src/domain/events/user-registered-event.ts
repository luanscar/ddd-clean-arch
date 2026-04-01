import { DomainEvent } from '@repo/shared-kernel'
import type { UniqueEntityId, Email } from '@repo/shared-kernel'
import type { UserRoleValue } from '../value-objects/role.js'

/**
 * UserRegisteredEvent — emitido quando um novo usuário é criado com sucesso.
 *
 * Consumidores típicos:
 *  - Envio de e-mail de boas-vindas
 *  - Criação de perfil em outros Bounded Contexts
 *  - Auditoria e analytics
 */
export class UserRegisteredEvent extends DomainEvent {
  readonly eventName = 'IDENTITY.USER_REGISTERED' as const

  constructor(
    aggregateId: UniqueEntityId,
    readonly email: Email,
    readonly role: UserRoleValue,
    readonly occurredAt: Date,
  ) {
    super(aggregateId)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      email: this.email.value,
      role: this.role,
    }
  }
}
