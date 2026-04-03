import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError, ValidationError } from '@repo/shared-kernel'
import { ParliamentaryRole } from '../../domain/value-objects/parliamentary-role.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface UpdateParliamentarianCommand {
  parliamentarianId: UniqueEntityId
  name?: string
  party?: string | null
  role?: string
  active?: boolean
  tenantId?: string
}

export class UpdateParliamentarianHandler {
  constructor(
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: UpdateParliamentarianCommand): Promise<Result<void, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const hasPatch =
      command.name !== undefined ||
      command.party !== undefined ||
      command.role !== undefined ||
      command.active !== undefined
    if (!hasPatch) {
      return R.fail(new ValidationError('At least one of name, party, role, active must be provided'))
    }

    const p = await this.parliamentarianRepository.findById(command.parliamentarianId, tenantId)
    if (!p) {
      return R.fail(new NotFoundError('Parliamentarian', command.parliamentarianId.toString()))
    }

    let roleVo: ParliamentaryRole | undefined
    if (command.role !== undefined) {
      const roleResult = ParliamentaryRole.create(command.role)
      if (!roleResult.ok) {
        return R.fail(roleResult.error)
      }
      roleVo = roleResult.value
    }

    p.applyUpdate(
      {
        name: command.name,
        party: command.party,
        role: roleVo,
        active: command.active,
      },
      new Date(),
    )

    await this.parliamentarianRepository.save(p)
    await this.eventDispatcher.dispatchAll(p.pullDomainEvents())
    return R.ok(undefined)
  }
}
