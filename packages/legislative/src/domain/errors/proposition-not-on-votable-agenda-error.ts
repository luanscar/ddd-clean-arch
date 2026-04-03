import { DomainError } from '@repo/shared-kernel'

export class PropositionNotOnVotableAgendaError extends DomainError {
  readonly code = 'LEGISLATIVE.PROPOSITION_NOT_ON_VOTABLE_AGENDA' as const

  constructor(propositionId: string) {
    super(
      `Proposition "${propositionId}" is not on the agenda as a VOTABLE_PROPOSITION item in this tenant`,
    )
  }
}
