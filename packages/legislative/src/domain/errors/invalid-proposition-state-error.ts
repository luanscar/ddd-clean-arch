import { DomainError } from '@repo/shared-kernel'

export class InvalidPropositionStateError extends DomainError {
  readonly code = 'LEGISLATIVE.INVALID_PROPOSITION_STATE' as const

  constructor(message: string, details?: unknown) {
    super(message, details)
  }
}
