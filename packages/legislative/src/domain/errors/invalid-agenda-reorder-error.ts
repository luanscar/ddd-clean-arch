import { DomainError } from '@repo/shared-kernel'

export class InvalidAgendaReorderError extends DomainError {
  readonly code = 'LEGISLATIVE.INVALID_AGENDA_REORDER' as const

  constructor(message = 'orderedItemIds must list every agenda item exactly once') {
    super(message)
  }
}
