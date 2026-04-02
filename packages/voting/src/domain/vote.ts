import * as crypto from 'node:crypto'
import { Entity, UniqueEntityId } from '@repo/shared-kernel'
import type { PollOption } from './value-objects/poll-option.js'

export interface VoteState {
  readonly voterId: UniqueEntityId
  readonly option: PollOption
  readonly occurredOn: Date
}

/**
 * Vote — Cédula de Voto individual dentro de uma Sessão de Votação (Poll).
 * Entidade que pertence exclusivamente ao Agregado Poll e nunca tem ciclo 
 * de vida próprio ou persistência isolada no repositório.
 */
export class Vote extends Entity<UniqueEntityId> {
  private _state: VoteState

  private constructor(id: UniqueEntityId, state: VoteState) {
    super(id)
    this._state = state
  }

  get voterId(): UniqueEntityId {
    return this._state.voterId
  }

  get option(): PollOption {
    return this._state.option
  }

  get occurredOn(): Date {
    return this._state.occurredOn
  }

  /**
   * Fábrica para criar um novo registro de Voto.
   */
  static cast(state: VoteState): Vote {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())
    return new Vote(id, state)
  }

  /**
   * Reconstituição pela camada de persistência.
   */
  static reconstitute(id: UniqueEntityId, state: VoteState): Vote {
    return new Vote(id, state)
  }

  toState(): VoteState {
    return { ...this._state }
  }
}
