import type { IDomainEvent } from './domain-event.js'
import type { IDomainEventHandler } from './domain-event-handler.js'

/**
 * IDomainEventDispatcher — Interface de contrato para o despachante de eventos.
 *
 * A implementação concreta pode ser in-process, via message broker (RabbitMQ,
 * Redis Streams), ou qualquer adaptador de infra — o domínio depende apenas
 * desta interface (Inversão de Dependência / DIP).
 */
export interface IDomainEventDispatcher {
  /**
   * Registra um handler para um tipo de evento.
   * Múltiplos handlers para o mesmo `eventName` são todos executados.
   */
  register<T extends IDomainEvent>(eventName: string, handler: IDomainEventHandler<T>): void

  /** Despacha um único evento para todos os handlers registrados. */
  dispatch(event: IDomainEvent): Promise<void>

  /** Despacha todos os eventos de uma vez (ex: após commit do UoW). */
  dispatchAll(events: ReadonlyArray<IDomainEvent>): Promise<void>

  /** Remove todos os handlers de um evento específico (ou todos se omitido). */
  clearHandlers(eventName?: string): void
}

// ─── InProcess implementation ────────────────────────────────────────────────

/**
 * InProcessDomainEventDispatcher — Implementação in-process para uso em
 * testes, monolitos e como ponto de partida antes de introduzir mensageria.
 *
 * Executa handlers em paralelo via `Promise.all`.
 * Para sequencial garntido, substitua por execução serial.
 */
export class InProcessDomainEventDispatcher implements IDomainEventDispatcher {
  private readonly handlers = new Map<string, IDomainEventHandler[]>()

  register<T extends IDomainEvent>(eventName: string, handler: IDomainEventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? []
    this.handlers.set(eventName, [...existing, handler as IDomainEventHandler])
  }

  async dispatch(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName) ?? []

    if (eventHandlers.length === 0) return

    await Promise.all(eventHandlers.map((handler) => handler.handle(event)))
  }

  async dispatchAll(events: ReadonlyArray<IDomainEvent>): Promise<void> {
    await Promise.all(events.map((event) => this.dispatch(event)))
  }

  clearHandlers(eventName?: string): void {
    if (eventName !== undefined) {
      this.handlers.delete(eventName)
    } else {
      this.handlers.clear()
    }
  }

  /** Retorna o número de handlers registrados para um evento (útil em testes). */
  handlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.length ?? 0
  }
}
