import type { Result, ITenantProvider, IDomainEventDispatcher, IClock } from '@repo/shared-kernel'
import { Result as R, Cpf, TenantId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Role } from '../../domain/value-objects/role.js'
import { Pin } from '../../domain/value-objects/pin.js'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'
import type { RegisterUserWithCpfCommand } from './cpf-auth.command.js'

/**
 * RegisterUserWithCpfHandler — Cadastro específico para parlamentares/servidores via CPF/PIN.
 * Segue SOLID (Separate Command) e DDD (Intent-revealing).
 */
export class RegisterUserWithCpfHandler
  implements ICommandHandler<RegisterUserWithCpfCommand, Result<UserProfileDTO, Error>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(
    command: RegisterUserWithCpfCommand,
  ): Promise<Result<UserProfileDTO, Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const cpfResult = Cpf.create(command.cpf)
    if (!cpfResult.ok) return R.fail(cpfResult.error)

    const pinResult = Pin.create(command.pin)
    if (!pinResult.ok) return R.fail(pinResult.error)

    const roleResult = command.role
      ? Role.create(command.role)
      : R.ok(Role.member())
    if (!roleResult.ok) return R.fail(roleResult.error)

    const existing = await this.userRepository.findByCpf(cpfResult.value, tenantId)
    if (existing !== null) {
      return R.fail(new UserAlreadyExistsError(`CPF ${command.cpf}`))
    }

    const hashedPin = await this.passwordHasher.hash(pinResult.value.value)
    const pinHash = PasswordHash.fromHash(hashedPin)

    const user = User.createWithCpf({
      cpf: cpfResult.value,
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
