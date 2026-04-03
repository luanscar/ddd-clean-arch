import { DomainError } from '@repo/shared-kernel'

export class AgendaItemNotFoundError extends DomainError {
  readonly code = 'LEGISLATIVE.AGENDA_ITEM_NOT_FOUND' as const

  constructor(sessionId: string, itemId: string) {
    super(`Agenda item "${itemId}" was not found on session "${sessionId}"`)
  }
}
