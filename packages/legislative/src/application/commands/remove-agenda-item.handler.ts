import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface RemoveAgendaItemCommand {
  sessionId: UniqueEntityId
  itemId: UniqueEntityId
  tenantId?: string
}

export class RemoveAgendaItemHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: RemoveAgendaItemCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(command.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', command.sessionId.toString()))
    }

    const now = new Date()
    const r = session.removeAgendaItem(command.itemId, now)
    if (!r.ok) {
      return r
    }
    await this.sessionRepository.save(session)
    return R.ok(undefined)
  }
}
