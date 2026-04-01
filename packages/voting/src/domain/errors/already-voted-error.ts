import { DomainError } from '@repo/shared-kernel'

export class AlreadyVotedError extends DomainError {
  readonly code = 'VOTING.ALREADY_VOTED'

  constructor(voterId: string, pollId: string) {
    super(`Voter ${voterId} already cast a vote in Poll ${pollId}.`)
    this.name = 'AlreadyVotedError'
  }
}
