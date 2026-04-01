import { DomainError } from '@repo/shared-kernel'

export class InvalidPollStateError extends DomainError {
  readonly code = 'VOTING.INVALID_POLL_STATE'

  constructor(message: string) {
    super(message)
    this.name = 'InvalidPollStateError'
  }
}
