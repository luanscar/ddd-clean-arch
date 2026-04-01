import type { IDomainEvent } from './domain-event.js'

/**
 * IDomainEventHandler<T> — Interface para handlers de eventos de domínio.
 *
 * Cada handler deve ser responsável por **uma única reação** a um tipo de evento
 * (SRP). Múltiplos handlers podem ser registrados para o mesmo evento.
 *
 * Handlers tipicamente:
 *  - Iniciam side-effects (envio de e-mail, atualização de read model)
 *  - Acionam use cases de outros contextos (comunicação entre BCs)
 *  - Publicam eventos de integração para sistemas externos
 *
 * @example
 *   class SendWelcomeEmailOnUserRegistered
 *     implements IDomainEventHandler<UserRegisteredEvent>
 *   {
 *     async handle(event: UserRegisteredEvent): Promise<void> {
 *       await this.emailService.sendWelcome(event.email)
 *     }
 *   }
 */
export interface IDomainEventHandler<T extends IDomainEvent = IDomainEvent> {
  handle(event: T): Promise<void>
}
