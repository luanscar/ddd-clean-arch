import type { Result } from '@repo/shared-kernel'
import { Result as R, UniqueEntityId, ValidationError } from '@repo/shared-kernel'
import { AgendaItemType, type AgendaItemTypeKind } from './value-objects/agenda-item-type.js'
import * as crypto from 'node:crypto'

const MAX_TITLE_LEN = 500
const MAX_DESCRIPTION_LEN = 8000

function normalizeOptionalText(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined
  }
  const t = s.trim()
  return t.length === 0 ? undefined : t
}

function validateTextFields(
  kind: AgendaItemTypeKind,
  title: string | undefined,
  description: string | undefined,
): Result<void, ValidationError> {
  if (!AgendaItemType.requiresProposition(kind)) {
    if (!title || title.trim().length === 0) {
      return R.fail(
        new ValidationError('Non-votable agenda items require a non-empty title'),
      )
    }
  }
  if (title !== undefined && title.length > MAX_TITLE_LEN) {
    return R.fail(new ValidationError(`Agenda item title must be at most ${MAX_TITLE_LEN} characters`))
  }
  if (description !== undefined && description.length > MAX_DESCRIPTION_LEN) {
    return R.fail(
      new ValidationError(`Agenda item description must be at most ${MAX_DESCRIPTION_LEN} characters`),
    )
  }
  return R.ok(undefined)
}

/**
 * Item da pauta da sessão deliberativa (filho do agregado DeliberativeSession).
 */
export class SessionAgendaItem {
  private constructor(
    private readonly _id: UniqueEntityId,
    private readonly _type: AgendaItemType,
    private readonly _position: number,
    private readonly _propositionId: UniqueEntityId | undefined,
    private readonly _title: string | undefined,
    private readonly _description: string | undefined,
    private readonly _createdAt: Date,
  ) {}

  get id(): UniqueEntityId {
    return this._id
  }

  get type(): AgendaItemType {
    return this._type
  }

  get position(): number {
    return this._position
  }

  get propositionId(): UniqueEntityId | undefined {
    return this._propositionId
  }

  /** Rótulo do expediente; obrigatório (não vazio) para tipos sem proposição. */
  get title(): string | undefined {
    return this._title
  }

  get description(): string | undefined {
    return this._description
  }

  get createdAt(): Date {
    return this._createdAt
  }

  static create(props: {
    type: AgendaItemType
    position: number
    propositionId?: UniqueEntityId
    title?: string
    description?: string
    now: Date
  }): Result<SessionAgendaItem, ValidationError> {
    const kind = props.type.value as AgendaItemTypeKind
    if (AgendaItemType.requiresProposition(kind) && !props.propositionId) {
      return R.fail(
        new ValidationError('VOTABLE_PROPOSITION agenda items require propositionId'),
      )
    }
    const title = normalizeOptionalText(props.title)
    const description = normalizeOptionalText(props.description)
    const vr = validateTextFields(kind, title, description)
    if (!vr.ok) {
      return R.fail(vr.error)
    }
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())
    return R.ok(
      new SessionAgendaItem(
        id,
        props.type,
        props.position,
        props.propositionId,
        title,
        description,
        props.now,
      ),
    )
  }

  static reconstitute(props: {
    id: UniqueEntityId
    type: AgendaItemType
    position: number
    propositionId?: UniqueEntityId
    title?: string
    description?: string
    createdAt: Date
  }): SessionAgendaItem {
    return new SessionAgendaItem(
      props.id,
      props.type,
      props.position,
      props.propositionId,
      props.title,
      props.description,
      props.createdAt,
    )
  }

  withPosition(position: number): SessionAgendaItem {
    return new SessionAgendaItem(
      this._id,
      this._type,
      position,
      this._propositionId,
      this._title,
      this._description,
      this._createdAt,
    )
  }

  /**
   * Atualiza tipo, proposição e/ou texto; `undefined` em title/description mantém o valor atual.
   */
  patch(props: {
    type?: AgendaItemType
    propositionId?: UniqueEntityId | null
    title?: string
    description?: string
  }): Result<SessionAgendaItem, ValidationError> {
    const nextType = props.type ?? this._type
    const kind = nextType.value as AgendaItemTypeKind
    let nextProp = this._propositionId
    if (props.propositionId !== undefined) {
      nextProp = props.propositionId === null ? undefined : props.propositionId
    }
    if (AgendaItemType.requiresProposition(kind) && !nextProp) {
      return R.fail(
        new ValidationError('VOTABLE_PROPOSITION agenda items require propositionId'),
      )
    }
    let nextTitle = this._title
    if (props.title !== undefined) {
      nextTitle = normalizeOptionalText(props.title)
    }
    let nextDesc = this._description
    if (props.description !== undefined) {
      nextDesc = normalizeOptionalText(props.description)
    }
    const vr = validateTextFields(kind, nextTitle, nextDesc)
    if (!vr.ok) {
      return R.fail(vr.error)
    }
    return R.ok(
      new SessionAgendaItem(
        this._id,
        nextType,
        this._position,
        nextProp,
        nextTitle,
        nextDesc,
        this._createdAt,
      ),
    )
  }

  /**
   * @deprecated Prefer `patch`; mantido para chamadas internas que só mudam tipo/proposição.
   */
  withTypeAndProposition(
    type: AgendaItemType,
    propositionId: UniqueEntityId | undefined,
  ): Result<SessionAgendaItem, ValidationError> {
    return this.patch({ type, propositionId: propositionId ?? null })
  }
}
