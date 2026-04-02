import type { UserStatusValue } from '../../domain/user-status.js'
import type { UserRoleValue } from '../../domain/value-objects/role.js'

/**
 * UserPersistence — Representação do modelo de dados (Data Model).
 *
 * É uma estrutura de dados plana (POJO) que reflete como o usuário
 * é armazenado em um banco de dados (ex: tabela SQL, documento NoSQL).
 *
 * NOTA: Usa apenas tipos primitivos e tipos de união simples.
 * Não deve conter lógica de negócio ou Value Objects do Domínio.
 */
export interface UserPersistence {
  readonly id: string
  readonly tenantId: string
  readonly email?: string
  readonly passwordHash?: string
  readonly cpf?: string
  readonly pinHash?: string
  readonly role: UserRoleValue
  readonly status: UserStatusValue
  readonly createdAt: Date
  readonly updatedAt: Date
}
