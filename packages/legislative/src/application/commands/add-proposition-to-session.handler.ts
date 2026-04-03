import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError, ConflictError, ValidationError } from '@repo/shared-kernel'
import type { IPropositionRepository } from '../../domain/repositories/proposition-repository.js'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'
import { AgendaItemType, type AgendaItemTypeKind } from '../../domain/value-objects/agenda-item-type.js'

export interface AddPropositionToSessionCommand {
  sessionId: UniqueEntityId
  /** Obrigatório quando o tipo exige proposição (ex.: VOTABLE_PROPOSITION). */
  propositionId?: UniqueEntityId
  /** Valor bruto do tipo de expediente; omisso ⇒ VOTABLE_PROPOSITION. */
  itemType?: string
  /** Obrigatório (não vazio após trim) para tipos sem proposição. Opcional para votável. */
  title?: string
  description?: string
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

    const typeResult = command.itemType
      ? AgendaItemType.create(command.itemType)
      : R.ok(AgendaItemType.votableProposition())
    if (!typeResult.ok) {
      return R.fail(typeResult.error)
    }
    const itemType = typeResult.value
    const kind = itemType.value as AgendaItemTypeKind

    if (AgendaItemType.requiresProposition(kind)) {
      if (!command.propositionId) {
        return R.fail(
          new ValidationError('propositionId is required for VOTABLE_PROPOSITION agenda items'),
        )
      }
      const proposition = await this.propositionRepository.findById(command.propositionId, tenantId)
      if (!proposition) {
        return R.fail(new NotFoundError('Proposition', command.propositionId.toString()))
      }
    }

    if (
      command.propositionId &&
      session.agendaItems.some((i) => i.propositionId?.equals(command.propositionId))
    ) {
      return R.fail(
        new ConflictError('SessionAgendaItem', 'propositionId', command.propositionId.toString()),
      )
    }

    const now = new Date()
    const r = session.addAgendaItem({
      type: itemType,
      propositionId: command.propositionId,
      title: command.title,
      description: command.description,
      now,
    })
    if (!r.ok) {
      return r
    }
    await this.sessionRepository.save(session)

    return R.ok(undefined)
  }
}
