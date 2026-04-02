import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError, ConflictError } from '@repo/shared-kernel'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'

export interface AddPropositionToSessionCommand {
  sessionId: UniqueEntityId
  propositionId: UniqueEntityId
  tenantId?: string
}

export class AddPropositionToSessionHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly propositionRepository: IPropositionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: AddPropositionToSessionCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(command.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', command.sessionId.toString()))
    }

    const proposition = await this.propositionRepository.findById(command.propositionId, tenantId)
    if (!proposition) {
      return R.fail(new NotFoundError('Proposition', command.propositionId.toString()))
    }

    if (session.propositions.some((id) => id.equals(command.propositionId))) {
      return R.fail(
        new ConflictError('SessionAgendaItem', 'propositionId', command.propositionId.toString()),
      )
    }

    const now = new Date()
    session.addProposition(command.propositionId, now)
    await this.sessionRepository.save(session)

    return R.ok(undefined)
  }
}
