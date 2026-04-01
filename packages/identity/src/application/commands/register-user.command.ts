import type { ICommand } from '@repo/shared-kernel'

export interface RegisterUserCommand extends ICommand {
  readonly commandName: 'IDENTITY.REGISTER_USER'
  readonly email: string
  readonly password: string
  /** opcional — padrão: 'member' */
  readonly role?: string
}
