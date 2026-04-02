import type {
  UniqueEntityId,
  Email,
  TenantId,
  Cpf,
  Pagination,
} from '@repo/shared-kernel'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { User } from '../../domain/user.js'
import type { UserPersistence } from './user-persistence.js'
import { UserPersistenceMapper } from '../mappers/user-persistence.mapper.js'

/**
 * InMemoryUserRepository — Implementação volátil para testes e demonstração.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserPersistence>()
  private readonly mapper = UserPersistenceMapper.instance

  async findByEmail(email: Email, tenantId: TenantId): Promise<User | null> {
    for (const userRaw of this.users.values()) {
      if (userRaw.email === email.value && userRaw.tenantId === tenantId.value) {
        return this.mapper.toDomain(userRaw)
      }
    }
    return null
  }

  async findByCpf(cpf: Cpf, tenantId: TenantId): Promise<User | null> {
    for (const userRaw of this.users.values()) {
      if (userRaw.cpf === cpf.value && userRaw.tenantId === tenantId.value) {
        return this.mapper.toDomain(userRaw)
      }
    }
    return null
  }

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<User | null> {
    const raw = this.users.get(id.value)
    if (raw && raw.tenantId === tenantId.value) {
      return this.mapper.toDomain(raw)
    }
    return null
  }

  async save(user: User): Promise<void> {
    const raw = this.mapper.toPersistence(user)
    this.users.set(raw.id, raw)
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    const raw = this.users.get(id.value)
    if (raw && raw.tenantId === tenantId.value) {
      this.users.delete(id.value)
    }
  }

  async exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean> {
    const raw = this.users.get(id.value)
    return !!raw && raw.tenantId === tenantId.value
  }

  async findAll(
    tenantId: TenantId,
    pagination: Pagination,
  ): Promise<{ users: User[]; total: number }> {
    const allTenantUsers = Array.from(this.users.values()).filter(
      (u) => u.tenantId === tenantId.value,
    )

    const total = allTenantUsers.length
    const offset = pagination.offset
    const limit = pagination.limit

    const paginatedRaws = allTenantUsers.slice(offset, offset + limit)
    const users = paginatedRaws.map((raw) => this.mapper.toDomain(raw))

    return { users, total }
  }
}
