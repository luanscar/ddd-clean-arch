import {
  UniqueEntityId,
  TenantId,
  Pagination,
  createPaginatedDTO,
  type PaginatedDTO,
} from '@repo/shared-kernel'
import { DeliberativeSession } from '../../domain/deliberative-session.js'
import { AgendaItemTypeValue } from '../../domain/value-objects/agenda-item-type.js'
import type {
  IDeliberativeSessionRepository,
  FindDeliberativeSessionsParams,
} from '../../domain/repositories/deliberative-session-repository.js'

export class InMemoryDeliberativeSessionRepository implements IDeliberativeSessionRepository {
  private items: DeliberativeSession[] = []

  async findById(id: UniqueEntityId, tenantId: TenantId): Promise<DeliberativeSession | null> {
    const item = this.items.find((i) => i.id.equals(id) && i.tenantId.equals(tenantId))
    return item ?? null
  }

  async save(session: DeliberativeSession): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(session.id))
    if (index >= 0) {
      this.items[index] = session
    } else {
      this.items.push(session)
    }
  }

  async delete(id: UniqueEntityId, tenantId: TenantId): Promise<void> {
    this.items = this.items.filter((i) => !(i.id.equals(id) && i.tenantId.equals(tenantId)))
  }

  async exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean> {
    return this.items.some((i) => i.id.equals(id) && i.tenantId.equals(tenantId))
  }

  async hasVotableAgendaItemForProposition(
    tenantId: TenantId,
    propositionId: UniqueEntityId,
  ): Promise<boolean> {
    return this.items.some((session) => {
      if (!session.tenantId.equals(tenantId)) {
        return false
      }
      return session.agendaItems.some(
        (item) =>
          item.type.value === AgendaItemTypeValue.VOTABLE_PROPOSITION &&
          item.propositionId?.equals(propositionId),
      )
    })
  }

  async findMany(params: FindDeliberativeSessionsParams): Promise<PaginatedDTO<DeliberativeSession>> {
    const filtered = this.items
      .filter((i) => i.tenantId.equals(params.tenantId))
      .sort((a, b) => b.date.getTime() - a.date.getTime())

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
