import type { ICommand } from '@repo/shared-kernel'

export interface AuthenticateUserCommand extends ICommand {
  readonly commandName: 'IDENTITY.AUTHENTICATE_USER'
  readonly email: string
  readonly password: string
  /** 
   * ID do inquilino. Essencial para isolamento de credenciais. 
   * Se omitido, pode falhar ou tentar resolver via contexto padrão.
   */
  readonly tenantId?: string
}
