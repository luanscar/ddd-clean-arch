import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface DeactivateParliamentarianCommand {
  parliamentarianId: UniqueEntityId
  tenantId?: string
}

/**
 * Soft delete: desativa o mandato sem apagar o registo (histórico de votações preservado).
 */
export class DeactivateParliamentarianHandler {
  constructor(
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: DeactivateParliamentarianCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const p = await this.parliamentarianRepository.findById(command.parliamentarianId, tenantId)
    if (!p) {
      return R.fail(new NotFoundError('Parliamentarian', command.parliamentarianId.toString()))
    }

    p.deactivate(new Date())
    await this.parliamentarianRepository.save(p)
    await this.eventDispatcher.dispatchAll(p.pullDomainEvents())
    return R.ok(undefined)
  }
}
