import type { ICommand } from '@repo/shared-kernel'

/**
 * Atualização de utilizador no inquilino por administrador (papel e/ou ativo). MVP-06.
 */
export interface UpdateTenantUserCommand extends ICommand {
  readonly commandName: 'IDENTITY.UPDATE_TENANT_USER'
  readonly userId: string
  readonly tenantId?: string
  readonly role?: string
  readonly active?: boolean
}
