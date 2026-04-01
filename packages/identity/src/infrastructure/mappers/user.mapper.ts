import { AbstractMapper } from '@repo/shared-kernel/infrastructure'
import { UniqueEntityId, Email } from '@repo/shared-kernel/domain'
import { User } from '../../domain/user.js'
import { PasswordHash, Role } from '../../domain/value-objects/index.js'
import type { UserProfileDTO } from '../../application/dtos/user-profile.dto.js'
import type { UserPersistence } from '../repositories/user-persistence.js'

/**
 * UserMapper — Implementação do Anti-Corruption Layer (ACL).
 *
 * Centraliza toda a lógica de tradução entre:
 *  1. Domínio (User Aggregate)
 *  2. Persistência (UserPersistence POJO)
 *  3. Aplicação (UserProfileDTO)
 *
 * Ao usar `User.reconstitute`, evitamos disparar eventos de domínio
 * ao carregar dados existentes do banco.
 */
export class UserMapper extends AbstractMapper<User, UserPersistence, UserProfileDTO> {
  /**
   * Data Model → Domain Model (Aggregate)
   */
  toDomain(raw: UserPersistence): User {
    const id = UniqueEntityId.reconstruct(raw.id)
    const emailResult = Email.create(raw.email)
    const roleResult = Role.create(raw.role)

    // Como os dados vêm da persistência (confiáveis), podemos dar unwrap
    // ou tratar erros de dados corrompidos.
    if (!emailResult.ok || !roleResult.ok) {
      throw new Error(`[UserMapper] Database corruption: invalid data for user ${raw.id}`)
    }

    return User.reconstitute(id, {
      email: emailResult.value,
      passwordHash: PasswordHash.fromHash(raw.passwordHash),
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
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      role: user.role.value,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  /**
   * Domain Model → Application DTO (Read Model)
   */
  toDTO(user: User): UserProfileDTO {
    return {
      id: user.id.value,
      email: user.email.value,
      role: user.role.value,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  /**
   * Singleton para uso global no pacote (opcional, dependendo do DI).
   */
  private static _instance: UserMapper
  static get instance(): UserMapper {
    if (!this._instance) this._instance = new UserMapper()
    return this._instance
  }
}
