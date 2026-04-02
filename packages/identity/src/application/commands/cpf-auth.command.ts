import type { ICommand } from '@repo/shared-kernel'

export interface RegisterUserWithCpfCommand extends ICommand {
  readonly commandName: 'IDENTITY.REGISTER_USER_WITH_CPF'
  readonly cpf: string
  readonly pin: string
  /** opcional — padrão: 'parliamentarian' ou 'member' */
  readonly role?: string
  /** opcional — id do inquilino. */
  readonly tenantId?: string
}

export interface AuthenticateWithCpfCommand extends ICommand {
  readonly commandName: 'IDENTITY.AUTHENTICATE_WITH_CPF'
  readonly cpf: string
  readonly pin: string
  readonly tenantId?: string
}

export interface LinkCpfCommand extends ICommand {
  readonly commandName: 'IDENTITY.LINK_CPF'
  readonly userId: string
  readonly cpf: string
  readonly pin: string
  readonly tenantId?: string
}
