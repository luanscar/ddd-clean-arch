import type { ICommand, ICommandHandler } from './command-handler.js'
import type { IQuery, IQueryHandler } from './query-handler.js'

// ─── Command Bus ─────────────────────────────────────────────────────────────

/**
 * ICommandBus — Despacha comandos para seus handlers registrados.
 *
 * Desacopla o emissor do comando do handler concreto.
 * A camada de aplicação emite comandos via bus; os handlers ficam no container de DI.
 *
 * @example
 *   // No use case / controller:
 *   await commandBus.dispatch(new RegisterUserCommand({ name, email }))
 */
export interface ICommandBus {
  /**
   * Registra o handler para um tipo de comando.
   * Um comando deve ter exatamente um handler (1:1).
   */
  register<C extends ICommand, R>(commandName: string, handler: ICommandHandler<C, R>): void

  /**
   * Despacha um comando ao seu handler registrado.
   * @throws {Error} Se nenhum handler estiver registrado para o comando.
   */
  dispatch<C extends ICommand, R>(command: C): Promise<R>
}

// ─── Query Bus ───────────────────────────────────────────────────────────────

/**
 * IQueryBus — Despacha queries para seus handlers registrados.
 *
 * @example
 *   const profile = await queryBus.dispatch(new GetUserProfileQuery({ userId }))
 */
export interface IQueryBus {
  register<Q extends IQuery, R>(queryName: string, handler: IQueryHandler<Q, R>): void
  dispatch<Q extends IQuery, R>(query: Q): Promise<R>
}

// ─── In-Process implementations ──────────────────────────────────────────────

/**
 * InProcessCommandBus — Implementação in-process do CommandBus.
 *
 * Executa o handler síncronamente no mesmo processo.
 * Substitua por uma implementação baseada em mensageria (RabbitMQ, Redis, etc.)
 * sem alterar nenhum código de domínio ou aplicação.
 */
export class InProcessCommandBus implements ICommandBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<string, ICommandHandler<any, any>>()

  register<C extends ICommand, R>(commandName: string, handler: ICommandHandler<C, R>): void {
    if (this.handlers.has(commandName)) {
      throw new Error(
        `[CommandBus] Handler already registered for command "${commandName}". ` +
          'A command must have exactly one handler.',
      )
    }
    this.handlers.set(commandName, handler)
  }

  async dispatch<C extends ICommand, R>(command: C): Promise<R> {
    const handler = this.handlers.get(command.commandName)

    if (!handler) {
      throw new Error(
        `[CommandBus] No handler registered for command "${command.commandName}". ` +
          'Register a handler before dispatching.',
      )
    }

    return handler.handle(command) as Promise<R>
  }

  /** Verifica se um handler está registrado (útil em testes). */
  hasHandler(commandName: string): boolean {
    return this.handlers.has(commandName)
  }
}

/**
 * InProcessQueryBus — Implementação in-process do QueryBus.
 */
export class InProcessQueryBus implements IQueryBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<string, IQueryHandler<any, any>>()

  register<Q extends IQuery, R>(queryName: string, handler: IQueryHandler<Q, R>): void {
    if (this.handlers.has(queryName)) {
      throw new Error(
        `[QueryBus] Handler already registered for query "${queryName}". ` +
          'A query must have exactly one handler.',
      )
    }
    this.handlers.set(queryName, handler)
  }

  async dispatch<Q extends IQuery, R>(query: Q): Promise<R> {
    const handler = this.handlers.get(query.queryName)

    if (!handler) {
      throw new Error(
        `[QueryBus] No handler registered for query "${query.queryName}". ` +
          'Register a handler before dispatching.',
      )
    }

    return handler.handle(query) as Promise<R>
  }

  hasHandler(queryName: string): boolean {
    return this.handlers.has(queryName)
  }
}
