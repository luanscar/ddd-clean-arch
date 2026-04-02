import type { HATEOASResource } from '@repo/shared-kernel'
import type { UserRoleValue } from '../../domain/value-objects/role.js'
import type { UserStatusValue } from '../../domain/user-status.js'

/**
 * UserProfileDTO — Representação de saída (read model) de um usuário.
 *
 * Nunca expõe `passwordHash`. IDs são strings simples (sem Brand types)
 * para segurança de serialização JSON.
 */
export interface UserProfileDTO extends HATEOASResource {
  readonly id: string
  readonly email?: string
  readonly cpf?: string
  readonly role: UserRoleValue
  readonly status: UserStatusValue
  readonly createdAt: string  // ISO 8601
  readonly updatedAt: string  // ISO 8601
}
