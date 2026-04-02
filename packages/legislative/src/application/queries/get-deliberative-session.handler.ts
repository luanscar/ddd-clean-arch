import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { DeliberativeSession } from '../../domain/deliberative-session.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface GetDeliberativeSessionQuery {
  sessionId: UniqueEntityId
  tenantId?: string
}

export class GetDeliberativeSessionHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(q: GetDeliberativeSessionQuery): Promise<Result<DeliberativeSession, DomainError>> {
    const tenantId = q.tenantId ? TenantId.reconstruct(q.tenantId) : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(q.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', q.sessionId.toString()))
    }
    return R.ok(session)
  }
}
