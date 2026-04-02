import { DomainError } from '@repo/shared-kernel'

export class UserCpfAlreadyExistsError extends DomainError {
  readonly code = 'IDENTITY.USER_CPF_ALREADY_EXISTS' as const

  constructor(cpf: string) {
    super(`User with CPF "${cpf}" already exists`)
  }
}
