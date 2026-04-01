import type { ICommand } from '@repo/shared-kernel/application'

export interface AuthenticateUserCommand extends ICommand {
  readonly commandName: 'IDENTITY.AUTHENTICATE_USER'
  readonly email: string
  readonly password: string
}
