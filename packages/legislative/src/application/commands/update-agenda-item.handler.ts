import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'
import { AgendaItemType } from '../../domain/value-objects/agenda-item-type.js'

export interface UpdateAgendaItemCommand {
  sessionId: UniqueEntityId
  itemId: UniqueEntityId
  itemType?: string
  /** `null` remove o vínculo com proposição quando o tipo o permitir. */
  propositionId?: UniqueEntityId | null
  title?: string
  description?: string
  tenantId?: string
}

export class UpdateAgendaItemHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(command: UpdateAgendaItemCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(command.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', command.sessionId.toString()))
    }

    let nextType: AgendaItemType | undefined
    if (command.itemType !== undefined) {
      const tr = AgendaItemType.create(command.itemType)
      if (!tr.ok) {
        return R.fail(tr.error)
      }
      nextType = tr.value
    }

    const now = new Date()
    const r = session.updateAgendaItem(command.itemId, {
      type: nextType,
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
