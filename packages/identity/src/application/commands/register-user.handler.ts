import type { Result, ITenantProvider, IDomainEventDispatcher, IClock } from '@repo/shared-kernel'
import { Result as R, Email, TenantId, Cpf, ValidationError, UniqueEntityId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import type { DomainError } from '@repo/shared-kernel'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Role } from '../../domain/value-objects/role.js'
import { Pin } from '../../domain/value-objects/pin.js'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error.js'
import { UserCpfAlreadyExistsError } from '../../domain/errors/user-cpf-already-exists-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { RegisterUserCommand } from './register-user.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * RegisterUserHandler — Orquestra o cadastro de um novo usuário.
 * Suporta identidade via Email (obrigatório) e CPF (opcional).
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
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const emailResult = Email.create(command.email)
    if (!emailResult.ok) return R.fail(new ValidationError(emailResult.error.message))

    const roleResult = command.role
      ? Role.create(command.role)
      : R.ok(Role.member())
    if (!roleResult.ok) return R.fail(new ValidationError(roleResult.error.message))

    // Verificar unicidade do e-mail
    const existingEmail = await this.userRepository.findByEmail(emailResult.value, tenantId)
    if (existingEmail !== null) {
      return R.fail(new UserAlreadyExistsError(command.email))
    }

    // Validar CPF se fornecido
    let cpf: Cpf | undefined
    let pinHash: PasswordHash | undefined

    if (command.cpf) {
      const cpfResult = Cpf.create(command.cpf)
      if (!cpfResult.ok) return R.fail(new ValidationError(cpfResult.error.message))
      cpf = cpfResult.value

      const existingCpf = await this.userRepository.findByCpf(cpf, tenantId)
      if (existingCpf !== null) {
        return R.fail(new UserCpfAlreadyExistsError(command.cpf))
      }

      if (command.pin) {
        const pinResult = Pin.create(command.pin)
        if (!pinResult.ok) return R.fail(new ValidationError(pinResult.error.message))
        const hashedPin = await this.passwordHasher.hash(pinResult.value.value)
        pinHash = PasswordHash.fromHash(hashedPin)
      }
    }

    const hashedPassword = await this.passwordHasher.hash(command.password)
    const passwordHash = PasswordHash.fromHash(hashedPassword)

    const user = User.create({
      email: emailResult.value,
      passwordHash,
      cpf,
      pinHash,
      role: roleResult.value,
      tenantId,
      now: this.clock.now(),
    })

    await this.userRepository.save(user)
    await this.eventDispatcher.dispatchAll(user.pullDomainEvents())

    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
