import type { UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import { Pagination } from '@repo/shared-kernel'
import type { IPollRepository, FindPollsParams } from '../../domain/repositories/poll-repository.js'
import type { Poll } from '../../domain/poll.js'
import type { PollPersistence } from './poll-persistence.js'
import { PollPersistenceMapper } from '../mappers/poll-persistence.mapper.js'
import { createPaginatedDTO } from '@repo/shared-kernel'

export class InMemoryPollRepository implements IPollRepository {
  private readonly polls = new Map<string, PollPersistence>()
  private readonly mapper = PollPersistenceMapper.instance

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<Poll | null> {
    const raw = this.polls.get(id.value)
    if (raw && raw.tenantId === tenantId.value) {
      return this.mapper.toDomain(raw)
    }
    return null
  }

  async save(poll: Poll): Promise<void> {
    const raw = this.mapper.toPersistence(poll)
    this.polls.set(raw.id, raw)
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    const raw = this.polls.get(id.value)
    if (raw && raw.tenantId === tenantId.value) {
      this.polls.delete(id.value)
    }
  }

  async exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean> {
    const raw = this.polls.get(id.value)
    return !!raw && raw.tenantId === tenantId.value
  }

  async findMany(params: FindPollsParams): Promise<PaginatedDTO<Poll>> {
    const all = Array.from(this.polls.values())
      .filter((p) => p.tenantId === params.tenantId.value)
      .filter((p) => !params.status || p.status === params.status)
    
    const paginationResult = Pagination.create(params.page, params.limit)
    if (!paginationResult.ok) {
        throw new Error('Invalid pagination parameters')
    }
    const pagination = paginationResult.value

    const start = (params.page - 1) * params.limit
    const end = start + params.limit
    const pageItems = all.slice(start, end)

    return createPaginatedDTO(
      this.mapper.toDomainList(pageItems),
      pagination,
      all.length
    )
  }
}
