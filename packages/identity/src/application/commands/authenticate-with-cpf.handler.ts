import type { Result, ITenantProvider, IDomainEventDispatcher, IClock } from '@repo/shared-kernel'
import { Result as R, Cpf, TenantId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials-error.js'
import { UserInactiveError } from '../../domain/errors/user-inactive-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'
import type { AuthenticateWithCpfCommand } from './cpf-auth.command.js'

/**
 * AuthenticateWithCpfHandler — Login via CPF e PIN.
 * Ideal para Terminais de votação e totens.
 */
export class AuthenticateWithCpfHandler
  implements ICommandHandler<AuthenticateWithCpfCommand, Result<UserProfileDTO, Error>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tenantProvider: ITenantProvider,
    private readonly eventDispatcher: IDomainEventDispatcher,
  ) {}

  async handle(
    command: AuthenticateWithCpfCommand,
  ): Promise<Result<UserProfileDTO, Error>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Validar CPF
    const cpfResult = Cpf.create(command.cpf)
    if (!cpfResult.ok) {
      return R.fail(new InvalidCredentialsError())
    }

    // 2. Buscar usuário por CPF
    const user = await this.userRepository.findByCpf(cpfResult.value, tenantId)
    if (!user) {
      return R.fail(new InvalidCredentialsError())
    }

    // 3. Validar estado
    if (!user.isActive) {
      return R.fail(new UserInactiveError())
    }

    // 4. Validar PIN (se existir)
    if (!user.pinHash) {
      return R.fail(new InvalidCredentialsError())
    }

    const isValid = await this.passwordHasher.verify(
      command.pin,
      user.pinHash.value,
    )

    if (!isValid) {
      return R.fail(new InvalidCredentialsError())
    }

    // 5. Emitir evento de login (Opcional, para auditoria)
    // user.addDomainEvent(new UserLoggedInEvent(user.id, ...))
    
    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
