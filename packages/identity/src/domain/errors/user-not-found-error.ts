import { DomainError } from '@repo/shared-kernel/domain'

export class UserNotFoundError extends DomainError {
  readonly code = 'IDENTITY.USER_NOT_FOUND' as const

  constructor(identifier?: string) {
    const identifierPart = identifier ? ` "${identifier}"` : ''
    super(`User${identifierPart} was not found`)
  }
}
