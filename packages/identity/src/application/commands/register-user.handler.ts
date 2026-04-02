import type { Result, ITenantProvider, IDomainEventDispatcher, IClock } from '@repo/shared-kernel'
import { Result as R, Email, TenantId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import type { DomainError } from '@repo/shared-kernel'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Role } from '../../domain/value-objects/role.js'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { RegisterUserCommand } from './register-user.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * RegisterUserHandler — Orquestra o cadastro de um novo usuário.
 *
 * Responsabilidades:
 *  1. Valida e-mail e role (VOs)
 *  2. Verifica unicidade do e-mail (repositório)
 *  3. Hasheia a senha (domain service)
 *  4. Cria o agregado User (factory do domínio)
 *  5. Persiste via repositório
 *  6. Retorna UserProfileDTO
 */
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(
    command: RegisterUserCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    // 0. Resolver Tenant
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Validar e-mail
    const emailResult = Email.create(command.email)
    if (!emailResult.ok) return emailResult

    // 2. Validar role (se fornecida)
    const roleResult = command.role
      ? Role.create(command.role)
      : R.ok(Role.member())
    if (!roleResult.ok) return roleResult

    // 3. Verificar unicidade do e-mail dentro do Tenant
    const existing = await this.userRepository.findByEmail(emailResult.value, tenantId)
    if (existing !== null) {
      return R.fail(new UserAlreadyExistsError(command.email))
    }

    // 4. Hasheiar senha
    const hashedPassword = await this.passwordHasher.hash(command.password)
    const passwordHash = PasswordHash.fromHash(hashedPassword)

    // 5. Criar agregado (factory do domínio emite UserRegisteredEvent)
    const user = User.create({
      email: emailResult.value,
      passwordHash,
      role: roleResult.value,
      tenantId,
      now: this.clock.now(),
    })

    // 6. Persistir
    await this.userRepository.save(user)
    await this.eventDispatcher.dispatchAll(user.pullDomainEvents())

    // 7. Retornar DTO via Application Mapper
    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
