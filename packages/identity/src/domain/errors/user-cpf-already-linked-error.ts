import { DomainError } from '@repo/shared-kernel'

export class UserCpfAlreadyLinkedError extends DomainError {
  readonly code = 'IDENTITY.USER_CPF_ALREADY_LINKED' as const

  constructor() {
    super('User already has a CPF linked')
  }
}
