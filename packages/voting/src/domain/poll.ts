import { AggregateRoot, UniqueEntityId, TenantId, DomainError, ValidationError } from '@repo/shared-kernel'
import type { Result } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import { PollStatus } from './value-objects/poll-status.js'
import { createPollOption, type PollOption } from './value-objects/poll-option.js'
import type { TallyResult } from './value-objects/tally-result.js'
import { Vote } from './vote.js'
import { AlreadyVotedError } from './errors/already-voted-error.js'
import { HasNotVotedError } from './errors/has-not-voted-error.js'
import { PollNotOpenError } from './errors/poll-not-open-error.js'
import { InvalidOptionError } from './errors/invalid-option-error.js'
import { InvalidPollStateError } from './errors/invalid-poll-state-error.js'
import { PollCreatedEvent } from './events/poll-created-event.js'
import * as crypto from 'node:crypto'
import { PollOpenedEvent } from './events/poll-opened-event.js'
import { PollClosedEvent } from './events/poll-closed-event.js'
import { VoteCastEvent } from './events/vote-cast-event.js'
import { VoteChangedEvent } from './events/vote-changed-event.js'

export interface PollState {
  title: string
  status: PollStatus
  allowedOptions: PollOption[]
  votes: Vote[]
  createdAt: Date
  openedAt: Date | null
  closedAt: Date | null
}

export class Poll extends AggregateRoot<UniqueEntityId> {
  private _state: PollState

  get title(): string {
    return this._state.title
  }
  get status(): PollStatus {
    return this._state.status
  }
  get allowedOptions(): PollOption[] {
    return [...this._state.allowedOptions]
  }
  get votes(): Vote[] {
    return [...this._state.votes]
  }

  private constructor(id: UniqueEntityId, tenantId: TenantId, state: PollState) {
    super(id, tenantId)
    this._state = state
  }

  /**
   * Factory para criar uma nova Sessão de Votação (Poll).
   * Inicia sempre como DRAFT.
   */
  static create(props: {
    title: string
    allowedOptions: string[]
    tenantId: TenantId
    now: Date
  }): Result<Poll, ValidationError> {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const options: PollOption[] = []
    for (const raw of props.allowedOptions) {
      const optResult = createPollOption(raw)
      if (!optResult.ok) {
        return R.fail(optResult.error)
      }
      options.push(optResult.value)
    }
    const uniqueOptions = Array.from(new Set(options))

    const state: PollState = {
      title: props.title,
      status: PollStatus.DRAFT,
      allowedOptions: uniqueOptions,
      votes: [],
      createdAt: props.now,
      openedAt: null,
      closedAt: null,
    }

    const poll = new Poll(id, props.tenantId, state)
    poll.addDomainEvent(new PollCreatedEvent(id, state.title, state.allowedOptions, props.now))

    return R.ok(poll)
  }

  /**
   * Reconstituição da camada de persistência.
   */
  static reconstitute(id: UniqueEntityId, tenantId: TenantId, state: PollState): Poll {
    return new Poll(id, tenantId, state)
  }

  /**
   * Abre a votação.
   */
  open(now: Date): Result<void, DomainError> {
    if (this._state.status !== PollStatus.DRAFT) {
      return R.fail(new InvalidPollStateError(`Poll is already ${this._state.status}. Cannot open.`))
    }

    this._state.status = PollStatus.OPEN
    this._state.openedAt = now

    this.addDomainEvent(new PollOpenedEvent(this.id, now))
    return R.ok(undefined)
  }

  /**
   * Computa o voto de um eleitor.
   * Regras de negócio (Invariantes):
   * 1. A votação deve estar aberta.
   * 2. O eleitor não pode ter votado antes.
   * 3. A opção deve estar na lista de opções permitidas.
   */
  castVote(
    voterId: UniqueEntityId,
    optionRaw: string,
    now: Date,
  ): Result<void, DomainError> {
    if (this._state.status !== PollStatus.OPEN) {
      return R.fail(new PollNotOpenError(this.id.toString(), this._state.status))
    }

    const optionResult = createPollOption(optionRaw)
    if (!optionResult.ok) {
      return R.fail(optionResult.error)
    }
    const option = optionResult.value

    if (!this._state.allowedOptions.includes(option)) {
      return R.fail(new InvalidOptionError(optionRaw, this._state.allowedOptions))
    }

    const hasVoted = this._state.votes.some((v) => v.voterId.equals(voterId))
    if (hasVoted) {
      return R.fail(new AlreadyVotedError(voterId.toString(), this.id.toString()))
    }

    const vote = Vote.cast({
      voterId,
      option,
      occurredOn: now,
    })

    this._state.votes.push(vote)

    this.addDomainEvent(new VoteCastEvent(this.id, voterId, option, now))
    return R.ok(undefined)
  }

  /**
   * Altera o voto de um eleitor que já votou, apenas com urna aberta (ex.: requisito legislativo).
   * Se a nova opção for igual à atual, não emite evento.
   */
  changeVote(
    voterId: UniqueEntityId,
    optionRaw: string,
    now: Date,
  ): Result<void, DomainError> {
    if (this._state.status !== PollStatus.OPEN) {
      return R.fail(new PollNotOpenError(this.id.toString(), this._state.status))
    }

    const optionResult = createPollOption(optionRaw)
    if (!optionResult.ok) {
      return R.fail(optionResult.error)
    }
    const option = optionResult.value

    if (!this._state.allowedOptions.includes(option)) {
      return R.fail(new InvalidOptionError(optionRaw, this._state.allowedOptions))
    }

    const idx = this._state.votes.findIndex((v) => v.voterId.equals(voterId))
    if (idx === -1) {
      return R.fail(new HasNotVotedError(voterId.toString(), this.id.toString()))
    }

    const previousOption = this._state.votes[idx]!.option
    if (previousOption === option) {
      return R.ok(undefined)
    }

    const newVote = Vote.cast({
      voterId,
      option,
      occurredOn: now,
    })
    this._state.votes[idx] = newVote

    this.addDomainEvent(new VoteChangedEvent(this.id, voterId, previousOption, option, now))
    return R.ok(undefined)
  }

  /**
   * Encerra a votação e contabiliza os votos, retornando o Tally final.
   */
  close(now: Date): Result<TallyResult, DomainError> {
    if (this._state.status === PollStatus.CLOSED) {
      return R.fail(new InvalidPollStateError(`Poll is already closed.`))
    }
    if (this._state.status !== PollStatus.OPEN) {
      return R.fail(
        new InvalidPollStateError(
          `Poll must be OPEN to close. Current status: ${this._state.status}.`,
        ),
      )
    }

    this._state.status = PollStatus.CLOSED
    this._state.closedAt = now

    const tally = this.computeTally()

    this.addDomainEvent(new PollClosedEvent(this.id, this.tenantId, tally, now))
    return R.ok(tally)
  }

  /**
   * Totaliza os votos atuais. (Pode ser chamado a qualquer momento para parciais).
   */
  computeTally(): TallyResult {
    const tally: Record<string, number> = {}

    // Inicializa o Tally com zero para todas as opções permitidas
    for (const opt of this._state.allowedOptions) {
      tally[opt] = 0
    }

    for (const vote of this._state.votes) {
      tally[vote.option]! += 1
    }

    return tally as TallyResult
  }

  toState(): PollState {
    return { ...this._state }
  }
}
