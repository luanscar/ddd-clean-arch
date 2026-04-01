import { DomainError } from '@repo/shared-kernel'

/**
 * UserInactiveError — disparado quando um usuário inativo tenta autenticar
 * ou executar uma operação que requer status ACTIVE.
 */
export class UserInactiveError extends DomainError {
  readonly code = 'IDENTITY.USER_INACTIVE' as const

  constructor() {
    super('User account is inactive. Please contact support.')
  }
}
