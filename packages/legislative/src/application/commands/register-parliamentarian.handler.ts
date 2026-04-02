import type { Result, UniqueEntityId, ITenantProvider, IDomainEventDispatcher } from '@repo/shared-kernel'
import { Result as R, TenantId } from '@repo/shared-kernel'
import { Parliamentarian } from '../../domain/parliamentarian.js'
import { ParliamentaryRole } from '../../domain/value-objects/parliamentary-role.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

export interface RegisterParliamentarianCommand {
  userId: UniqueEntityId
  name: string
  party?: string
  role?: string
  tenantId?: string
}

/**
 * RegisterParliamentarianHandler — Caso de uso para registrar um novo parlamentar.
 * 
 * Vincula um usuário (Identity) ao papel deliberativo no Legislative context.
 */
export class RegisterParliamentarianHandler {
  constructor(
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async execute(command: RegisterParliamentarianCommand): Promise<Result<UniqueEntityId, Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Verificar se ja existe parlamentar p/ esse user nesse tenant
    const existing = await this.parliamentarianRepository.findByUserId(command.userId, tenantId)
    if (existing) {
      return R.fail(new Error(`User already registered as a parliamentarian for this tenant`))
    }

    // 2. Criar Role
    const roleResult = command.role 
      ? ParliamentaryRole.create(command.role)
      : R.ok(ParliamentaryRole.member())

    if (!roleResult.ok) {
      return R.fail(roleResult.error)
    }

    // 3. Criar Agregado
    const parliamentarian = Parliamentarian.create({
      userId: command.userId,
      name: command.name,
      party: command.party,
      role: roleResult.value,
      tenantId,
      now: new Date(),
    })

    // 4. Persistir
    await this.parliamentarianRepository.save(parliamentarian)
    await this.eventDispatcher.dispatchAll(parliamentarian.pullDomainEvents())

    return R.ok(parliamentarian.id)
  }
}
