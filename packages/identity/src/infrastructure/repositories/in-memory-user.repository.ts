import type { UniqueEntityId, Email } from '@repo/shared-kernel/domain'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { User } from '../../domain/user.js'
import type { UserPersistence } from './user-persistence.js'
import { UserMapper } from '../mappers/user.mapper.js'

/**
 * InMemoryUserRepository — Implementação volátil para testes e demonstração.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserPersistence>()
  private readonly mapper = UserMapper.instance

  async findByEmail(email: Email): Promise<User | null> {
    for (const userRaw of this.users.values()) {
      if (userRaw.email === email.value) {
        return this.mapper.toDomain(userRaw)
      }
    }
    return null
  }

  async findById(id: UniqueEntityId): Promise<User | null> {
    const raw = this.users.get(id.value)
    return raw ? this.mapper.toDomain(raw) : null
  }

  async save(user: User): Promise<void> {
    const raw = this.mapper.toPersistence(user)
    this.users.set(raw.id, raw)
    // Numa implementação real, aqui dispararíamos dispatcher.dispatchAll(user.pullDomainEvents())
  }

  async delete(id: UniqueEntityId): Promise<void> {
    this.users.delete(id.value)
  }

  async exists(id: UniqueEntityId): Promise<boolean> {
    return this.users.has(id.value)
  }
}
