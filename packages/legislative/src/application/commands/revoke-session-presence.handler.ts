import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface RevokeSessionPresenceCommand {
  sessionId: UniqueEntityId
  parliamentarianId: UniqueEntityId
  tenantId?: string
}

export class RevokeSessionPresenceHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: RevokeSessionPresenceCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(command.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', command.sessionId.toString()))
    }

    const r = session.revokePresence(command.parliamentarianId, new Date())
    if (!r.ok) {
      return r
    }
    await this.sessionRepository.save(session)
    return R.ok(undefined)
  }
}
