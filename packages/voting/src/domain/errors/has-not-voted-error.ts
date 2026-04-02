import { DomainError } from '@repo/shared-kernel'

/** Eleitor ainda não possui cédula nesta urna — não é possível alterar voto. */
export class HasNotVotedError extends DomainError {
  readonly code = 'VOTING.HAS_NOT_VOTED'

  constructor(
    public readonly voterId: string,
    public readonly pollId: string,
  ) {
    super(`Voter ${voterId} has not voted on poll ${pollId}; cannot change vote.`)
    this.name = 'HasNotVotedError'
  }
}
