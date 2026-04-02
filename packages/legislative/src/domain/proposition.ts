import type { Result } from '@repo/shared-kernel'
import { Result as R, AggregateRoot, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import { PropositionStatus } from './value-objects/proposition-status.js'
import { PropositionSubmittedEvent } from './events/proposition-submitted.event.js'
import { PropositionFinalizedEvent } from './events/proposition-finalized.event.js'
import * as crypto from 'node:crypto'

interface PropositionState {
  authorId: UniqueEntityId  // ParliamentaryId
  title: string
  description: string
  status: PropositionStatus
  pollId?: UniqueEntityId   // Vínculo com context de Voting quando estiver em votação
  readonly createdAt: Date
  updatedAt: Date
}

/**
 * Proposition - Agregado que representa o objeto deliberativo (PL, Requerimento, etc).
 * 
 * Regras de Negócio:
 * - Apenas o autor ou o presidente podem retirá-la de pauta (simplificado p/ v1).
 * - Uma proposição só pode votar se estiver em UNDER_REVIEW.
 * - O resultado final (Aprovada/Rejeitada) depende do retorno do motor de Voting.
 */
export class Proposition extends AggregateRoot<UniqueEntityId> {
  private _state: PropositionState

  private constructor(id: UniqueEntityId, tenantId: TenantId, state: PropositionState) {
    super(id, tenantId)
    this._state = state
  }

  get authorId(): UniqueEntityId {
    return this._state.authorId
  }

  get title(): string {
    return this._state.title
  }

  get status(): PropositionStatus {
    return this._state.status
  }

  get pollId(): UniqueEntityId | undefined {
    return this._state.pollId
  }

  /**
   * Factory para nova proposição (Draft).
   */
  static create(props: {
    authorId: UniqueEntityId
    title: string
    description: string
    tenantId: TenantId
    now: Date
  }): Proposition {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const state: PropositionState = {
      authorId: props.authorId,
      title: props.title,
      description: props.description,
      status: PropositionStatus.draft(),
      createdAt: props.now,
      updatedAt: props.now,
    }

    const proposition = new Proposition(id, props.tenantId, state)
    
    proposition.addDomainEvent(new PropositionSubmittedEvent(
      id,
      props.authorId,
      props.title,
      props.description,
      props.now
    ))

    return proposition
  }

  /**
   * Reconstituição.
   */
  static reconstitute(id: UniqueEntityId, tenantId: TenantId, state: PropositionState): Proposition {
    return new Proposition(id, tenantId, state)
  }

  // ─── Comportamento de Domínio ───────────────────────────────────────────────

  submitForReview(now: Date): Result<void, Error> {
    if (this._state.status.value !== 'DRAFT') {
      return R.fail(new Error('Only Draft propositions can be submitted for review'))
    }
    this._state.status = PropositionStatus.underReview()
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  startVoting(pollId: UniqueEntityId, now: Date): Result<void, Error> {
    if (!this._state.status.canStartVoting()) {
      return R.fail(new Error(`Proposition "${this.title}" is not ready for voting (Current: ${this.status.value})`))
    }
    this._state.status = PropositionStatus.voting()
    this._state.pollId = pollId
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  finalize(approved: boolean, now: Date): Result<void, Error> {
    if (this._state.status.value !== 'VOTING') {
      return R.fail(new Error('Only propositions currently in voting can be finalized'))
    }
    this._state.status = approved ? PropositionStatus.approved() : PropositionStatus.rejected()
    this._state.updatedAt = now
    
    this.addDomainEvent(new PropositionFinalizedEvent(
      this.id,
      approved,
      now
    ))

    return R.ok(undefined)
  }

  toState(): Readonly<PropositionState> {
    return { ...this._state }
  }
}
