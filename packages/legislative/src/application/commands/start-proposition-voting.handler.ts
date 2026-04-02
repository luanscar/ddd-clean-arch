import type {
  Result,
  UniqueEntityId,
  ITenantProvider,
  IDomainEventDispatcher,
  DomainError,
} from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { ICreateLegislativePoll } from '../ports/create-legislative-poll.port.js'

export interface StartPropositionVotingCommand {
  propositionId: UniqueEntityId
  tenantId?: string
}

/**
 * StartPropositionVotingHandler — Orquestrador entre Legislative e Voting.
 *
 * 1. Recupera a Proposição.
 * 2. Aciona o motor de Voting via porta ICreateLegislativePoll (adapter na composição).
 * 3. Vincula a PollId e atualiza o status para VOTING.
 */
export class StartPropositionVotingHandler {
  constructor(
    private readonly propositionRepository: IPropositionRepository,
    private readonly createLegislativePoll: ICreateLegislativePoll,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(
    command: StartPropositionVotingCommand,
  ): Promise<Result<UniqueEntityId, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const proposition = await this.propositionRepository.findById(command.propositionId, tenantId)
    if (!proposition) {
      return R.fail(new NotFoundError('Proposition', command.propositionId.toString()))
    }

    if (proposition.status.value === 'DRAFT') {
      const reviewResult = proposition.submitForReview(new Date())
      if (!reviewResult.ok) {
        return R.fail(reviewResult.error)
      }
    }

    const pollResult = await this.createLegislativePoll.create({
      title: `Votação: ${proposition.title}`,
      allowedOptions: ['SIM', 'NÃO', 'ABSTENÇÃO'],
      tenantId: tenantId.value,
    })

    if (!pollResult.ok) {
      return R.fail(pollResult.error)
    }

    const pollId = pollResult.value

    const startResult = proposition.startVoting(pollId, new Date())
    if (!startResult.ok) {
      return R.fail(startResult.error)
    }

    await this.propositionRepository.save(proposition)
    await this.eventDispatcher.dispatchAll(proposition.pullDomainEvents())

    return R.ok(pollId)
  }
}
