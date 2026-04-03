import type { Result } from '@repo/shared-kernel'
import { Result as R, ValueObject, ValidationError } from '@repo/shared-kernel'

export const AgendaItemTypeValue = {
  VOTABLE_PROPOSITION: 'VOTABLE_PROPOSITION',
  READING: 'READING',
  COMMUNICATION: 'COMMUNICATION',
  OTHER: 'OTHER',
} as const

export type AgendaItemTypeKind = (typeof AgendaItemTypeValue)[keyof typeof AgendaItemTypeValue]

interface AgendaItemTypeProps {
  readonly value: AgendaItemTypeKind
}

/**
 * Tipo de expediente / item na ordem do dia (EDT-4.3.c).
 * Apenas VOTABLE_PROPOSITION exige proposição e é elegível para MVP-01 (abrir urna).
 */
export class AgendaItemType extends ValueObject<AgendaItemTypeProps> {
  get value(): AgendaItemTypeKind {
    return this.props.value
  }

  private constructor(props: AgendaItemTypeProps) {
    super(props)
  }

  static create(raw: string): Result<AgendaItemType, ValidationError> {
    const allowed = Object.values(AgendaItemTypeValue) as string[]
    const v = raw.toUpperCase()
    if (!allowed.includes(v)) {
      return R.fail(
        new ValidationError(`Invalid agenda item type "${raw}". Allowed: ${allowed.join(', ')}`),
      )
    }
    return R.ok(new AgendaItemType({ value: v as AgendaItemTypeKind }))
  }

  static votableProposition(): AgendaItemType {
    return new AgendaItemType({ value: AgendaItemTypeValue.VOTABLE_PROPOSITION })
  }

  static reading(): AgendaItemType {
    return new AgendaItemType({ value: AgendaItemTypeValue.READING })
  }

  static communication(): AgendaItemType {
    return new AgendaItemType({ value: AgendaItemTypeValue.COMMUNICATION })
  }

  static other(): AgendaItemType {
    return new AgendaItemType({ value: AgendaItemTypeValue.OTHER })
  }

  static requiresProposition(kind: AgendaItemTypeKind): boolean {
    return kind === AgendaItemTypeValue.VOTABLE_PROPOSITION
  }

  static allowsOpeningPoll(kind: AgendaItemTypeKind): boolean {
    return kind === AgendaItemTypeValue.VOTABLE_PROPOSITION
  }

  toString(): string {
    return this.props.value
  }
}
