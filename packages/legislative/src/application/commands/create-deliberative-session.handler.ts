import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import { DeliberativeSession } from '../../domain/deliberative-session.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'
import { ParliamentarianInactiveError } from '../../domain/errors/parliamentarian-inactive-error.js'

export interface CreateDeliberativeSessionCommand {
  title: string
  date: Date
  presidentId: UniqueEntityId
  tenantId?: string
}

export class CreateDeliberativeSessionHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: CreateDeliberativeSessionCommand): Promise<Result<UniqueEntityId, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const president = await this.parliamentarianRepository.findById(command.presidentId, tenantId)
    if (!president) {
      return R.fail(new NotFoundError('Parliamentarian', command.presidentId.toString()))
    }
    if (!president.isActive()) {
      return R.fail(new ParliamentarianInactiveError(command.presidentId.toString()))
    }

    const session = DeliberativeSession.create({
      title: command.title,
      date: command.date,
      presidentId: command.presidentId,
      tenantId,
      now: new Date(),
    })

    await this.sessionRepository.save(session)

    return R.ok(session.id)
  }
}
