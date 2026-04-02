import type { UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import { createPaginatedDTO, Pagination } from '@repo/shared-kernel'
import type { IPropositionRepository, FindPropositionsParams } from '../../domain/repositories/proposition-repository.js'
import type { Proposition } from '../../domain/proposition.js'

export class InMemoryPropositionRepository implements IPropositionRepository {
  private items: Proposition[] = []

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Proposition | null> {
    const item = this.items.find((i) => i.id.equals(id) && i.tenantId.equals(tenantId))
    return item ?? null
  }

  async findByPollId(pollId: UniqueEntityId, tenantId: TenantId): Promise<Proposition | null> {
    const item = this.items.find(
      (i) => i.tenantId.equals(tenantId) && i.pollId?.equals(pollId),
    )
    return item ?? null
  }

  async save(proposition: Proposition): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(proposition.id))
    if (index >= 0) {
      this.items[index] = proposition
    } else {
      this.items.push(proposition)
    }
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    this.items = this.items.filter((i) => !(i.id.equals(id) && i.tenantId.equals(tenantId)))
  }

  async exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean> {
    return this.items.some((i) => i.id.equals(id) && i.tenantId.equals(tenantId))
  }

  async findMany(params: FindPropositionsParams): Promise<PaginatedDTO<Proposition>> {
    let filtered = this.items.filter((i) => i.tenantId.equals(params.tenantId))

    if (params.status) {
      filtered = filtered.filter((i) => i.status.equals(params.status!))
    }

    if (params.authorId) {
      filtered = filtered.filter((i) => i.authorId.equals(params.authorId!))
    }

    const paginationResult = Pagination.create(params.page || 1, params.limit || 10)
    if (!paginationResult.ok) {
      throw paginationResult.error
    }
    const pagination = paginationResult.value

    const start = (pagination.page - 1) * pagination.limit
    const end = start + pagination.limit
    const pageItems = filtered.slice(start, end)

    return createPaginatedDTO(pageItems, pagination, filtered.length)
  }
}
