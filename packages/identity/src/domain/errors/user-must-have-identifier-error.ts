import { DomainError } from '@repo/shared-kernel'

export class UserMustHaveIdentifierError extends DomainError {
  readonly code = 'IDENTITY.USER_MUST_HAVE_IDENTIFIER' as const

  constructor() {
    super('User must have at least an email or a CPF')
  }
}
