import type { ICommand } from '@repo/shared-kernel'

/**
 * AuthenticateCommand — Comando unificado para autenticação.
 * 
 * O 'identifier' pode ser tanto um e-mail quanto um CPF. 
 * O 'secret' pode ser tanto a senha (password) quanto o PIN.
 */
export interface AuthenticateCommand extends ICommand {
  readonly commandName: 'IDENTITY.AUTHENTICATE'
  readonly identifier: string
  readonly secret: string
  readonly tenantId?: string
}
