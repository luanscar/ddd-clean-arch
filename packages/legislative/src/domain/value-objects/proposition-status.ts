import type { Result } from '@repo/shared-kernel'
import { Result as R, ValueObject, ValidationError } from '@repo/shared-kernel'

export const PropositionStatusValue = {
  DRAFT: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VOTING: 'VOTING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type PropositionStatusType = (typeof PropositionStatusValue)[keyof typeof PropositionStatusValue]

interface PropositionStatusProps {
  readonly value: PropositionStatusType
}

/**
 * PropositionStatus — Máquina de estados da Proposição.
 * 
 * Regras:
 * - DRAFT: Editável.
 * - UNDER_REVIEW: Em pauta, aguardando votação.
 * - VOTING: Urna aberta no contexto de Voting.
 * - APPROVED/REJECTED: Finalizado.
 */
export class PropositionStatus extends ValueObject<PropositionStatusProps> {
  get value(): PropositionStatusType {
    return this.props.value
  }

  private constructor(props: PropositionStatusProps) {
    super(props)
  }

  static create(raw: string): Result<PropositionStatus, ValidationError> {
    const validStatuses = Object.values(PropositionStatusValue) as string[]
    if (!validStatuses.includes(raw.toUpperCase())) {
      return R.fail(
        new ValidationError(`Invalid proposition status "${raw}". Allowed: ${validStatuses.join(', ')}`),
      )
    }
    return R.ok(new PropositionStatus({ value: raw.toUpperCase() as PropositionStatusType }))
  }

  static draft(): PropositionStatus {
    return new PropositionStatus({ value: PropositionStatusValue.DRAFT })
  }

  static underReview(): PropositionStatus {
    return new PropositionStatus({ value: PropositionStatusValue.UNDER_REVIEW })
  }

  static voting(): PropositionStatus {
    return new PropositionStatus({ value: PropositionStatusValue.VOTING })
  }

  static approved(): PropositionStatus {
    return new PropositionStatus({ value: PropositionStatusValue.APPROVED })
  }

  static rejected(): PropositionStatus {
    return new PropositionStatus({ value: PropositionStatusValue.REJECTED })
  }



  canStartVoting(): boolean {
    return this.props.value === PropositionStatusValue.UNDER_REVIEW
  }

  toString(): string {
    return this.props.value
  }
}
