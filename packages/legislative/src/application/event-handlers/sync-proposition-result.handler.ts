import type { IDomainEventHandler, IDomainEventDispatcher } from '@repo/shared-kernel'
import type { PollClosedEvent, TallyResult } from '@repo/voting'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'

function tallyOptionCount(tally: TallyResult, option: string): number {
  const record = tally as Record<string, number>
  return record[option] ?? 0
}

/**
 * SyncPropositionResultOnPollClosed — Escuta o encerramento de uma votação
 * no motor genérico e atualiza a proposição correspondente.
 */
export class SyncPropositionResultOnPollClosed implements IDomainEventHandler<PollClosedEvent> {
  constructor(
    private readonly propositionRepository: IPropositionRepository,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(event: PollClosedEvent): Promise<void> {
    const proposition = await this.propositionRepository.findByPollId(
      event.pollId,
      event.tenantId,
    )

    if (!proposition) {
      return
    }

    const votesSim = tallyOptionCount(event.finalTally, 'SIM')
    const votesNao = tallyOptionCount(event.finalTally, 'NÃO')
    const isApproved = votesSim > votesNao

    const result = proposition.finalize(isApproved, event.occurredOn)

    if (!result.ok) {
      return
    }

    await this.propositionRepository.save(proposition)
    await this.eventDispatcher.dispatchAll(proposition.pullDomainEvents())
  }
}
