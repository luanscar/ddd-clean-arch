import type { Result, ITenantProvider, IDomainEventDispatcher, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, ValidationError, UniqueEntityId, NotFoundError } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import { Role, UserRole } from '../../domain/value-objects/role.js'
import { LastTenantAdminError } from '../../domain/errors/last-tenant-admin-error.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { UpdateTenantUserCommand } from './update-tenant-user.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

export class UpdateTenantUserHandler
  implements ICommandHandler<UpdateTenantUserCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(
    command: UpdateTenantUserCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    if (command.role === undefined && command.active === undefined) {
      return R.fail(new ValidationError('At least one of role or active must be provided'))
    }

    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const userId = UniqueEntityId.reconstruct(command.userId)
    const user = await this.userRepository.findById(userId, tenantId)
    if (!user) {
      return R.fail(new NotFoundError('User', command.userId))
    }

    const wasAdmin = user.role.value === UserRole.ADMIN

    if (command.role !== undefined) {
      const roleResult = Role.create(command.role)
      if (!roleResult.ok) {
        return R.fail(roleResult.error)
      }
      const nextRole = roleResult.value
      const becomesNonAdmin = nextRole.value !== UserRole.ADMIN

      if (wasAdmin && becomesNonAdmin) {
        const admins = await this.userRepository.countActiveAdmins(tenantId)
        if (admins <= 1) {
          return R.fail(new LastTenantAdminError())
        }
      }

      user.assignRole(nextRole, new Date())
    }

    if (command.active !== undefined) {
      if (command.active) {
        user.activate(new Date())
      } else {
        if (wasAdmin) {
          const admins = await this.userRepository.countActiveAdmins(tenantId)
          if (admins <= 1) {
            return R.fail(new LastTenantAdminError())
          }
        }
        const d = user.deactivate(new Date())
        if (!d.ok) {
          return R.fail(d.error)
        }
      }
    }

    await this.userRepository.save(user)
    await this.eventDispatcher.dispatchAll(user.pullDomainEvents())

    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
