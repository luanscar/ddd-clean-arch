import * as crypto from 'node:crypto'
import type { Result, DomainError } from '@repo/shared-kernel'
import { Result as R, AggregateRoot, UniqueEntityId, TenantId, ValidationError } from '@repo/shared-kernel'
import { SessionAgendaItem } from './session-agenda-item.js'
import { AgendaItemType, type AgendaItemTypeKind } from './value-objects/agenda-item-type.js'
import { AgendaItemNotFoundError } from './errors/agenda-item-not-found-error.js'
import { InvalidAgendaReorderError } from './errors/invalid-agenda-reorder-error.js'
import { SessionAttendanceEntry } from './session-attendance-entry.js'

export interface DeliberativeSessionState {
  title: string
  date: Date
  presidentId: UniqueEntityId
  agendaItems: SessionAgendaItem[]
  attendance: SessionAttendanceEntry[]
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

  /** Itens da pauta ordenados por `position`. */
  get agendaItems(): ReadonlyArray<SessionAgendaItem> {
    return this.sortedAgendaItems()
  }

  /** Presenças registadas (sem ordenação garantida). */
  get attendance(): ReadonlyArray<SessionAttendanceEntry> {
    return [...this._state.attendance]
  }

  /**
   * Ids de proposição na ordem da pauta (apenas itens com `propositionId`).
   * Derivado de `agendaItems` para compatibilidade com clientes legados.
   */
  get propositions(): ReadonlyArray<UniqueEntityId> {
    return this.sortedAgendaItems()
      .filter((i) => i.propositionId !== undefined)
      .map((i) => i.propositionId as UniqueEntityId)
  }

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
      agendaItems: [],
      attendance: [],
      createdAt: props.now,
      updatedAt: props.now,
    }

    return new DeliberativeSession(id, props.tenantId, state)
  }

  static reconstitute(
    id: UniqueEntityId,
    tenantId: TenantId,
    state: DeliberativeSessionState,
  ): DeliberativeSession {
    return new DeliberativeSession(id, tenantId, state)
  }

  private sortedAgendaItems(): SessionAgendaItem[] {
    return [...this._state.agendaItems].sort((a, b) => a.position - b.position)
  }

  private renumberPositions(items: SessionAgendaItem[]): SessionAgendaItem[] {
    return items.map((item, index) => item.withPosition(index))
  }

  private hasDuplicateProposition(propositionId: UniqueEntityId, excludeItemId?: UniqueEntityId): boolean {
    return this._state.agendaItems.some(
      (i) =>
        i.propositionId?.equals(propositionId) &&
        (!excludeItemId || !i.id.equals(excludeItemId)),
    )
  }

  addProposition(propositionId: UniqueEntityId, now: Date): void {
    const r = this.addAgendaItem({
      type: AgendaItemType.votableProposition(),
      propositionId,
      now,
    })
    if (!r.ok) {
      throw new Error(`addProposition invariant: ${r.error.message}`)
    }
  }

  addAgendaItem(props: {
    type: AgendaItemType
    propositionId?: UniqueEntityId
    title?: string
    description?: string
    now: Date
  }): Result<void, DomainError> {
    const kind = props.type.value as AgendaItemTypeKind
    if (props.propositionId && this.hasDuplicateProposition(props.propositionId)) {
      return R.fail(
        new ValidationError('This proposition is already on the session agenda', {
          propositionId: props.propositionId.toString(),
        }),
      )
    }
    if (AgendaItemType.requiresProposition(kind) && !props.propositionId) {
      return R.fail(new ValidationError('VOTABLE_PROPOSITION agenda items require propositionId'))
    }

    const position = this._state.agendaItems.length
    const created = SessionAgendaItem.create({
      type: props.type,
      position,
      propositionId: props.propositionId,
      title: props.title,
      description: props.description,
      now: props.now,
    })
    if (!created.ok) {
      return R.fail(created.error)
    }

    this._state.agendaItems = this.renumberPositions([...this._state.agendaItems, created.value])
    this._state.updatedAt = props.now
    return R.ok(undefined)
  }

  removeAgendaItem(itemId: UniqueEntityId, now: Date): Result<void, DomainError> {
    const idx = this._state.agendaItems.findIndex((i) => i.id.equals(itemId))
    if (idx < 0) {
      return R.fail(new AgendaItemNotFoundError(this.id.toString(), itemId.toString()))
    }
    const next = this._state.agendaItems.filter((_, i) => i !== idx)
    this._state.agendaItems = this.renumberPositions(next)
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  updateAgendaItem(
    itemId: UniqueEntityId,
    props: {
      type?: AgendaItemType
      propositionId?: UniqueEntityId | null
      title?: string
      description?: string
      now: Date
    },
  ): Result<void, DomainError> {
    const idx = this._state.agendaItems.findIndex((i) => i.id.equals(itemId))
    if (idx < 0) {
      return R.fail(new AgendaItemNotFoundError(this.id.toString(), itemId.toString()))
    }
    const current = this._state.agendaItems[idx]!
    const updated = current.patch({
      type: props.type,
      propositionId: props.propositionId,
      title: props.title,
      description: props.description,
    })
    if (!updated.ok) {
      return R.fail(updated.error)
    }
    const u = updated.value
    if (u.propositionId && this.hasDuplicateProposition(u.propositionId, itemId)) {
      return R.fail(
        new ValidationError('This proposition is already on the session agenda', {
          propositionId: u.propositionId.toString(),
        }),
      )
    }
    const next = [...this._state.agendaItems]
    next[idx] = u
    this._state.agendaItems = this.renumberPositions(next)
    this._state.updatedAt = props.now
    return R.ok(undefined)
  }

  /**
   * Regista ou atualiza presença (idempotente por parlamentar — atualiza `recordedAt`).
   */
  registerPresence(parliamentarianId: UniqueEntityId, now: Date): void {
    const idx = this._state.attendance.findIndex((a) => a.parliamentarianId.equals(parliamentarianId))
    const entry = SessionAttendanceEntry.create(parliamentarianId, now)
    if (idx >= 0) {
      const next = [...this._state.attendance]
      next[idx] = entry
      this._state.attendance = next
    } else {
      this._state.attendance = [...this._state.attendance, entry]
    }
    this._state.updatedAt = now
  }

  revokePresence(parliamentarianId: UniqueEntityId, now: Date): Result<void, DomainError> {
    const idx = this._state.attendance.findIndex((a) => a.parliamentarianId.equals(parliamentarianId))
    if (idx < 0) {
      return R.fail(
        new ValidationError('Parliamentarian is not marked present for this session', {
          parliamentarianId: parliamentarianId.toString(),
        }),
      )
    }
    this._state.attendance = this._state.attendance.filter((_, i) => i !== idx)
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  reorderAgendaItems(orderedItemIds: UniqueEntityId[], now: Date): Result<void, DomainError> {
    const current = new Set(this._state.agendaItems.map((i) => i.id.toString()))
    if (orderedItemIds.length !== current.size) {
      return R.fail(new InvalidAgendaReorderError())
    }
    for (const id of orderedItemIds) {
      if (!current.has(id.toString())) {
        return R.fail(new InvalidAgendaReorderError())
      }
    }
    const byId = new Map(this._state.agendaItems.map((i) => [i.id.toString(), i]))
    const reordered = orderedItemIds.map((id) => byId.get(id.toString())!)
    this._state.agendaItems = this.renumberPositions(reordered)
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  toState(): Readonly<DeliberativeSessionState> {
    return {
      ...this._state,
      agendaItems: [...this._state.agendaItems],
      attendance: [...this._state.attendance],
    }
  }
}
