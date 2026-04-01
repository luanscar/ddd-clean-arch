import type { UniqueEntityId } from './value-objects/unique-entity-id.js'
import type { IDomainEvent } from './domain-event.js'
import { Entity } from './entity.js'

/**
 * AggregateRoot<ID> — Raiz de Agregado DDD.
 *
 * Estende `Entity` adicionando:
 *  - Coleção interna de `DomainEvent`s gerados durante a transação
 *  - `pullDomainEvents()` para o repositório coletar e despachar após commit
 *
 * Regras de ouro para Agregados:
 *  1. Referências externas ao agregado são feitas apenas pelo ID (nunca por referência direta)
 *  2. Toda mutação de estado deve ocorrer via métodos de domínio do próprio agregado
 *  3. O agregado é a fronteira de consistência transacional — uma transação = um agregado
 *  4. Eventos de domínio são disparados após, não durante, a persistência bem-sucedida
 *
 * @example
 *   class Order extends AggregateRoot<UniqueEntityId> {
 *     approve(): void {
 *       this._status = 'approved'
 *       this.addDomainEvent(new OrderApprovedEvent(this.id))
 *     }
 *   }
 *
 *   // No repositório, após salvar:
 *   const events = order.pullDomainEvents()
 *   await dispatcher.dispatchAll(events)
 */
export abstract class AggregateRoot<
  ID extends UniqueEntityId = UniqueEntityId,
> extends Entity<ID> {
  private _domainEvents: IDomainEvent[] = []

  /** Eventos acumulados durante esta transação de domínio (somente leitura). */
  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents
  }

  /**
   * Registra um evento para ser despachado após a persistência bem-sucedida.
   * Deve ser chamado apenas por métodos de domínio internos ao agregado.
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event)
  }

  /**
   * Remove e retorna todos os eventos acumulados.
   * Deve ser chamado pelo repositório após o commit bem-sucedido.
   */
  pullDomainEvents(): IDomainEvent[] {
    const events = [...this._domainEvents]
    this.clearDomainEvents()
    return events
  }

  /**
   * Limpa os eventos sem retorná-los.
   * Use em reconstrução de agregados a partir da persistência.
   */
  clearDomainEvents(): void {
    this._domainEvents = []
  }

  /** Verifica se há eventos pendentes para despacho. */
  hasDomainEvents(): boolean {
    return this._domainEvents.length > 0
  }
}
