import { DomainError } from '@repo/shared-kernel'

/** Parlamentar existe mas está desativado (soft delete). */
export class ParliamentarianInactiveError extends DomainError {
  readonly code = 'LEGISLATIVE.PARLIAMENTARIAN_INACTIVE'

  constructor(public readonly parliamentarianId: string) {
    super(`Parliamentarian ${parliamentarianId} is inactive`)
    this.name = 'ParliamentarianInactiveError'
  }
}
