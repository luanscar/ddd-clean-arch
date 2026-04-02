import type { IDomainEventHandler, IDomainEventDispatcher } from '@repo/shared-kernel'
import type { PollClosedEvent } from '@repo/voting'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'

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
    const pollId = event.pollId
    
    // 1. Localizar a proposição vinculada a esta Poll
    const proposition = await this.propositionRepository.findByPollId(pollId)
    
    if (!proposition) {
      // Se não houver proposição vinculada, ignoramos (pode ser uma votação de outro contexto)
      return
    }

    // 2. Determinar se foi aprovada ou rejeitada
    // Regra: SIM > NÃO (Simplificado para v1)
    const tally = event.finalTally as any
    const votesSim = tally['SIM'] || 0
    const votesNao = tally['NÃO'] || 0
    
    const isApproved = votesSim > votesNao

    // 3. Finalizar o agregado
    const result = proposition.finalize(isApproved, event.occurredOn)
    
    if (result.ok) {
        // 4. Persistir alteração
        await this.propositionRepository.save(proposition)
        // 5. Despachar eventos da própria proposição (ex: PropositionFinalizedEvent)
        await this.eventDispatcher.dispatchAll(proposition.pullDomainEvents())
        
        console.log(`[Legislative] Proposition ${proposition.id.toString()} finalized as ${isApproved ? 'APPROVED' : 'REJECTED'}`)
    } else {
        console.error(`[Legislative] Failed to finalize proposition ${proposition.id.toString()}: ${result.error.message}`)
    }
  }
}
