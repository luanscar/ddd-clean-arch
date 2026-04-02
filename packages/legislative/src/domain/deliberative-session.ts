import { AggregateRoot, UniqueEntityId, TenantId } from '@repo/shared-kernel'

interface DeliberativeSessionState {
  title: string
  date: Date
  presidentId: UniqueEntityId  // ParliamentaryId referenciando o Parlamentar que conduz
  propositions: UniqueEntityId[] // Lista de PropositionIds na pauta
  readonly createdAt: Date
  updatedAt: Date
}

/**
 * DeliberativeSession: Evento que organiza uma pauta de deliberação.
 * 
 * É aqui que agrupamos Propositions para serem votadas em sequência.
 */
export class DeliberativeSession extends AggregateRoot<UniqueEntityId> {
  private _state: DeliberativeSessionState

  private constructor(id: UniqueEntityId, tenantId: TenantId, state: DeliberativeSessionState) {
    super(id, tenantId)
    this._state = state
  }

  get title(): string {
    return this._state.title
  }

  get date(): Date {
    return this._state.date
  }

  get presidentId(): UniqueEntityId {
    return this._state.presidentId
  }

  get propositions(): ReadonlyArray<UniqueEntityId> {
    return [...this._state.propositions]
  }

  /**
   * Factory para uma nova sessão.
   */
  static create(props: {
    title: string
    date: Date
    presidentId: UniqueEntityId
    tenantId: TenantId
    now: Date
  }): DeliberativeSession {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const state: DeliberativeSessionState = {
      title: props.title,
      date: props.date,
      presidentId: props.presidentId,
      propositions: [],
      createdAt: props.now,
      updatedAt: props.now,
    }

    return new DeliberativeSession(id, props.tenantId, state)
  }

  static reconstitute(id: UniqueEntityId, tenantId: TenantId, state: DeliberativeSessionState): DeliberativeSession {
    return new DeliberativeSession(id, tenantId, state)
  }

  // ─── Comportamento de Domínio ───────────────────────────────────────────────

  addProposition(propositionId: UniqueEntityId, now: Date): void {
    // Invariante básica: evitar duplicação na pauta da sessão.
    if (!this._state.propositions.some(id => id.equals(propositionId))) {
      this._state.propositions.push(propositionId)
      this._state.updatedAt = now
    }
  }

  toState(): Readonly<DeliberativeSessionState> {
    return { ...this._state }
  }
}
