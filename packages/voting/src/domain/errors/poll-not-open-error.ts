import { DomainError } from '@repo/shared-kernel'

export class PollNotOpenError extends DomainError {
  readonly code = 'VOTING.POLL_NOT_OPEN'

  constructor(pollId: string, currentStatus: string) {
    super(`Poll ${pollId} is not OPEN (current status: ${currentStatus}).`)
    this.name = 'PollNotOpenError'
  }
}
