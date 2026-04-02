import { UniqueEntityId, Email, TenantId, Cpf } from '@repo/shared-kernel'
import type { IPersistenceMapper } from '@repo/shared-kernel/infrastructure/mapper.js'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Role } from '../../domain/value-objects/role.js'
import type { UserPersistence } from '../repositories/user-persistence.js'

/**
 * UserPersistenceMapper — Converte o Agregado User em um Padrão de Persistência (Database).
 * Reside em Infraestrutura pois conhece detalhes como IDs crus e Strings de erro do Banco.
 */
export class UserPersistenceMapper implements IPersistenceMapper<User, UserPersistence> {
  /**
   * Data Model → Domain Model (Aggregate)
   */
  toDomain(raw: UserPersistence): User {
    const id = UniqueEntityId.reconstruct(raw.id)
    const roleResult = Role.create(raw.role)
    const tenantId = TenantId.reconstruct(raw.tenantId)

    if (!roleResult.ok) {
      throw new Error(`[UserPersistenceMapper] Database corruption: invalid role for user ${raw.id}`)
    }

    let email: Email | undefined
    if (raw.email) {
      const emailResult = Email.create(raw.email)
      if (!emailResult.ok) {
        throw new Error(`[UserPersistenceMapper] Database corruption: invalid email for user ${raw.id}`)
      }
      email = emailResult.value
    }

    let cpf: Cpf | undefined
    if (raw.cpf) {
      const cpfResult = Cpf.create(raw.cpf)
      if (!cpfResult.ok) {
        throw new Error(`[UserPersistenceMapper] Database corruption: invalid CPF for user ${raw.id}`)
      }
      cpf = cpfResult.value
    }

    return User.reconstitute(id, tenantId, {
      email,
      passwordHash: raw.passwordHash ? PasswordHash.fromHash(raw.passwordHash) : undefined,
      cpf,
      pinHash: raw.pinHash ? PasswordHash.fromHash(raw.pinHash) : undefined,
      role: roleResult.value,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  /**
   * Domain Model → Data Model (Persistence)
   */
  toPersistence(user: User): UserPersistence {
    const state = user.toState()
    return {
      id: user.id.value,
      tenantId: user.tenantId.value,
      email: user.email?.value,
      passwordHash: user.passwordHash?.value,
      cpf: user.cpf?.value,
      pinHash: user.pinHash?.value,
      role: user.role.value,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  toDomainList(persistenceList: UserPersistence[]): User[] {
    return persistenceList.map((p) => this.toDomain(p))
  }

  toPersistenceList(domainList: User[]): UserPersistence[] {
    return domainList.map((d) => this.toPersistence(d))
  }

  private static _instance: UserPersistenceMapper
  static get instance(): UserPersistenceMapper {
    if (!this._instance) this._instance = new UserPersistenceMapper()
    return this._instance
  }
}
