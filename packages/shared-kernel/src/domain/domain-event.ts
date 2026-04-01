import type { UniqueEntityId } from './value-objects/unique-entity-id.js'

/**
 * IDomainEvent — Contrato de um Evento de Domínio.
 *
 * Eventos de domínio representam fatos imutáveis do passado:
 * algo relevante que aconteceu no domínio e que outras partes
 * do sistema precisam saber.
 *
 * Convenção de nomenclatura: verbos no passado
 *   ✅ OrderPlaced, UserRegistered, PaymentConfirmed
 *   ❌ PlaceOrder, RegisterUser
 */
export interface IDomainEvent {
  /** ID do agregado que gerou este evento. */
  readonly aggregateId: UniqueEntityId
  /** Momento em que o evento ocorreu (imutável após criação). */
  readonly occurredOn: Date
  /**
   * Nome canônico do evento para roteamento no dispatcher.
   * Convenção: SCREAMING_SNAKE_CASE (ex: 'ORDER_PLACED', 'USER_REGISTERED')
   */
  readonly eventName: string
}

/**
 * DomainEvent — Implementação base abstrata de IDomainEvent.
 *
 * Subclasses devem:
 *  1. Declarar `eventName` como `readonly` com valor literal
 *  2. Adicionar quaisquer dados relevantes do evento como props
 *
 * @example
 *   class OrderPlacedEvent extends DomainEvent {
 *     readonly eventName = 'ORDER_PLACED' as const
 *
 *     constructor(
 *       orderId: UniqueEntityId,
 *       readonly customerId: UniqueEntityId,
 *       readonly totalInCents: number,
 *     ) {
 *       super(orderId)
 *     }
 *   }
 */
export abstract class DomainEvent implements IDomainEvent {
  readonly occurredOn: Date

  abstract readonly eventName: string

  protected constructor(readonly aggregateId: UniqueEntityId) {
    this.occurredOn = new Date()
  }

  /** Serialização para logging e auditoria. */
  toJSON(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId.toString(),
      occurredOn: this.occurredOn.toISOString(),
    }
  }
}
