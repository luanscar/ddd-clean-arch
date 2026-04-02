import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
import { Proposition } from '../../domain/proposition.js'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface SubmitPropositionCommand {
  authorId: UniqueEntityId  // ParliamentaryId
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

  async execute(command: SubmitPropositionCommand): Promise<Result<UniqueEntityId, Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Verificar autor
    const author = await this.parliamentarianRepository.findById(command.authorId, tenantId)
    if (!author) {
      return R.fail(new Error(`Parliamentarian with id ${command.authorId.toString()} not found in this tenant`))
    }

    // 2. Criar Agregado (Default: DRAFT)
    const proposition = Proposition.create({
      authorId: command.authorId,
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
