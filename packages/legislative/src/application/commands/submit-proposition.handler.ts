import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError, ValidationError } from '@repo/shared-kernel'
import { Proposition } from '../../domain/proposition.js'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface SubmitPropositionCommand {
  /** ID do agregado Parliamentarian (autor explícito). */
  authorId?: UniqueEntityId
  /** ID do utilizador Identity — resolve o parlamentar por `findByUserId` (fluxo JWT). */
  authorUserId?: UniqueEntityId
  title: string
  description: string
  tenantId?: string
}

/**
 * SubmitPropositionHandler — Caso de uso p/ submeter novo projeto legislativo.
 * 
 * Verifica se o autor existe e persiste o Draft.
 */
export class SubmitPropositionHandler {
  constructor(
    private readonly propositionRepository: IPropositionRepository,
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: SubmitPropositionCommand): Promise<Result<UniqueEntityId, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    let authorParliamentaryId: UniqueEntityId
    if (command.authorUserId) {
      const byUser = await this.parliamentarianRepository.findByUserId(command.authorUserId, tenantId)
      if (!byUser) {
        return R.fail(new NotFoundError('Parliamentarian', command.authorUserId.toString()))
      }
      authorParliamentaryId = byUser.id
    } else if (command.authorId) {
      const byId = await this.parliamentarianRepository.findById(command.authorId, tenantId)
      if (!byId || !byId.isActive()) {
        return R.fail(new NotFoundError('Parliamentarian', command.authorId.toString()))
      }
      authorParliamentaryId = command.authorId
    } else {
      return R.fail(new ValidationError('Informe authorUserId ou authorId'))
    }

    // 2. Criar Agregado (Default: DRAFT)
    const proposition = Proposition.create({
      authorId: authorParliamentaryId,
      title: command.title,
      description: command.description,
      tenantId,
      now: new Date(),
    })

    // 3. Persistir
    await this.propositionRepository.save(proposition)
    await this.eventDispatcher.dispatchAll(proposition.pullDomainEvents())

    return R.ok(proposition.id)
  }
}
