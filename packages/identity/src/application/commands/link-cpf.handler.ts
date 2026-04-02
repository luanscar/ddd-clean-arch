import type { Result, ITenantProvider, IDomainEventDispatcher, IClock } from '@repo/shared-kernel'
import { Result as R, Cpf, TenantId, ValidationError, UniqueEntityId } from '@repo/shared-kernel'
import type { ICommandHandler, DomainError } from '@repo/shared-kernel'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Pin } from '../../domain/value-objects/pin.js'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error.js'
import { NotFoundError } from '@repo/shared-kernel'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { LinkCpfCommand } from './cpf-auth.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * LinkCpfHandler — Vincula um CPF a um usuário já existente (ex: cadastrado via e-mail).
 */
export class LinkCpfHandler
  implements ICommandHandler<LinkCpfCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly clock: IClock,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(
    command: LinkCpfCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const userId = UniqueEntityId.reconstruct(command.userId)
    const user = await this.userRepository.findById(userId, tenantId)

    if (!user) {
      return R.fail(new NotFoundError('User', command.userId))
    }

    const cpfResult = Cpf.create(command.cpf)
    if (!cpfResult.ok) return R.fail(new ValidationError(cpfResult.error.message))
    const cpf = cpfResult.value

    // Verificar se o CPF já está em uso por outro usuário
    const existingCpf = await this.userRepository.findByCpf(cpf, tenantId)
    if (existingCpf !== null && existingCpf.id.value !== user.id.value) {
      return R.fail(new UserAlreadyExistsError(`CPF ${command.cpf}`))
    }

    const pinResult = Pin.create(command.pin)
    if (!pinResult.ok) return R.fail(new ValidationError(pinResult.error.message))
    
    const hashedPin = await this.passwordHasher.hash(pinResult.value.value)
    const pinHash = PasswordHash.fromHash(hashedPin)

    const linkResult = user.linkCpf(cpf, pinHash, this.clock.now())
    if (!linkResult.ok) {
      return R.fail(new ValidationError(linkResult.error.message))
    }

    await this.userRepository.save(user)
    await this.eventDispatcher.dispatchAll(user.pullDomainEvents())

    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
