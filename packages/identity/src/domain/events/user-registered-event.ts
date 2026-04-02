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
    public readonly userId: UniqueEntityId,
    public readonly email: Email | undefined,
    public readonly cpf: string | undefined,
    public readonly role: UserRoleValue,
    readonly occurredOn: Date,
  ) {
    super(userId, occurredOn)
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      email: this.email?.value,
      cpf: this.cpf,
      role: this.role,
    }
  }
}
