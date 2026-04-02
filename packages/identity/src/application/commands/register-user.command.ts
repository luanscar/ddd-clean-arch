import type { ICommand } from '@repo/shared-kernel'

export interface RegisterUserCommand extends ICommand {
  readonly commandName: 'IDENTITY.REGISTER_USER'
  readonly email: string
  readonly password: string
  /** opcional — CPF para parlamentares/servidores */
  readonly cpf?: string
  /** opcional — PIN de 6 dígitos para acompanhamento de CPF */
  readonly pin?: string
  /** opcional — padrão: 'member' */
  readonly role?: string
  /** opcional — id do inquilino. Se omitido, o sistema tentará resolver via contexto. */
  readonly tenantId?: string
}
