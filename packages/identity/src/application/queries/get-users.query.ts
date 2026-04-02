import type { IQuery } from '@repo/shared-kernel'

/**
 * GetUsersQuery — Solicitação de listagem de usuários com paginação.
 */
export interface GetUsersQuery extends IQuery {
  readonly queryName: 'IDENTITY.GET_USERS'
  readonly tenantId: string
  readonly page?: number
  readonly limit?: number
}
