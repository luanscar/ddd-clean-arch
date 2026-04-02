import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { CreatePollHandler } from '@repo/voting'

export interface StartPropositionVotingCommand {
  propositionId: UniqueEntityId
  tenantId?: string
}

/**
 * StartPropositionVotingHandler — Orquestrador entre Legislative e Voting.
 * 
 * 1. Recupera a Proposição.
 * 2. Aciona o motor de Voting para criar uma pauta (Poll).
 * 3. Vincula a PollId e atualiza o status para VOTING.
 */
export class StartPropositionVotingHandler {
  constructor(
    private readonly propositionRepository: IPropositionRepository,
    private readonly createPollHandler: CreatePollHandler,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: StartPropositionVotingCommand): Promise<Result<UniqueEntityId, Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Buscar Proposição
    const proposition = await this.propositionRepository.findById(command.propositionId, tenantId)
    if (!proposition) {
      return R.fail(new Error(`Proposition with id ${command.propositionId.toString()} not found`))
    }

    // 2. Garantir que esteja em UNDER_REVIEW (ou mover de DRAFT p/ REVIEW se simplificado)
    if (proposition.status.value === 'DRAFT') {
      const reviewResult = proposition.submitForReview(new Date())
      if (!reviewResult.ok) return R.fail(reviewResult.error)
    }

    // 3. Criar Poll no motor de Voting
    // Para proposições legislativas, as opções padrão são SIM, NÃO e ABSTENÇÃO.
    const pollResult = await this.createPollHandler.execute({
      title: `Votação: ${proposition.title}`,
      allowedOptions: ['SIM', 'NÃO', 'ABSTENÇÃO'],
      tenantId: tenantId.value
    })

    if (!pollResult.ok) {
      return R.fail(pollResult.error)
    }

    const pollId = pollResult.value

    // 4. Vincular Poll à Proposição e mudar status para VOTING
    const startResult = proposition.startVoting(pollId, new Date())
    if (!startResult.ok) {
      return R.fail(startResult.error)
    }

    // 5. Salvar alteração
    await this.propositionRepository.save(proposition)
    await this.eventDispatcher.dispatchAll(proposition.pullDomainEvents())

    return R.ok(pollId)
  }
}
