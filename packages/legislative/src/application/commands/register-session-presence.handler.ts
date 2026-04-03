import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface RegisterSessionPresenceCommand {
  sessionId: UniqueEntityId
  parliamentarianId: UniqueEntityId
  tenantId?: string
}

export class RegisterSessionPresenceHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: RegisterSessionPresenceCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(command.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', command.sessionId.toString()))
    }

    const mp = await this.parliamentarianRepository.findById(command.parliamentarianId, tenantId)
    if (!mp?.isActive()) {
      return R.fail(new NotFoundError('Parliamentarian', command.parliamentarianId.toString()))
    }

    session.registerPresence(command.parliamentarianId, new Date())
    await this.sessionRepository.save(session)
    return R.ok(undefined)
  }
}
