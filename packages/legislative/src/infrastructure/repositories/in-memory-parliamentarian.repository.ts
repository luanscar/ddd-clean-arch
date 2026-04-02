import {
  UniqueEntityId,
  TenantId,
  Pagination,
  createPaginatedDTO,
  type PaginatedDTO,
} from '@repo/shared-kernel'
import { Parliamentarian } from '../../domain/parliamentarian.js'
import type {
  IParliamentarianRepository,
  FindParliamentariansParams,
} from '../../domain/repositories/parliamentarian-repository.js'

export class InMemoryParliamentarianRepository implements IParliamentarianRepository {
  private items: Parliamentarian[] = []

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null> {
    const item = this.items.find(i => i.id.equals(id) && i.tenantId.equals(tenantId))
    return item ?? null
  }

  async findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null> {
    const item = this.items.find(i => i.userId.equals(userId) && i.tenantId.equals(tenantId))
    return item ?? null
  }

  async save(parliamentarian: Parliamentarian): Promise<void> {
    const index = this.items.findIndex(i => i.id.equals(parliamentarian.id))
    if (index >= 0) {
      this.items[index] = parliamentarian
    } else {
      this.items.push(parliamentarian)
    }
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    this.items = this.items.filter(i => !(i.id.equals(id) && i.tenantId.equals(tenantId)))
  }

  async exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean> {
    return this.items.some(i => i.id.equals(id) && i.tenantId.equals(tenantId))
  }

  async findMany(params: FindParliamentariansParams): Promise<PaginatedDTO<Parliamentarian>> {
    const filtered = this.items
      .filter((i) => i.tenantId.equals(params.tenantId))
      .sort((a, b) => a.name.localeCompare(b.name))

    const paginationResult = Pagination.create(params.page ?? 1, params.limit ?? 10)
    if (!paginationResult.ok) {
      throw paginationResult.error
    }
    const pagination = paginationResult.value
    const skip = (pagination.page - 1) * pagination.limit
    const slice = filtered.slice(skip, skip + pagination.limit)

    return createPaginatedDTO(slice, pagination, filtered.length)
  }
}
