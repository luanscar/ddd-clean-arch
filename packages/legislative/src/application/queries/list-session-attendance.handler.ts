import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { SessionAttendanceEntry } from '../../domain/session-attendance-entry.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface ListSessionAttendanceQuery {
  sessionId: UniqueEntityId
  tenantId?: string
}

export class ListSessionAttendanceHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(
    query: ListSessionAttendanceQuery,
  ): Promise<Result<SessionAttendanceEntry[], DomainError>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(query.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', query.sessionId.toString()))
    }

    return R.ok([...session.attendance])
  }
}
