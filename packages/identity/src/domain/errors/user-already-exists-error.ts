import { DomainError } from '@repo/shared-kernel'

export class UserAlreadyExistsError extends DomainError {
  readonly code = 'IDENTITY.USER_ALREADY_EXISTS' as const

  constructor(email: string) {
    super(`User with email "${email}" already exists`)
  }
}
