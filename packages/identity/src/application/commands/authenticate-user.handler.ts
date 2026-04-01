import type { Result, ITenantProvider } from '@repo/shared-kernel'
import { Result as R, Email, TenantId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import type { DomainError } from '@repo/shared-kernel'
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials-error.js'
import { UserInactiveError } from '../../domain/errors/user-inactive-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { AuthenticateUserCommand } from './authenticate-user.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * AuthenticateUserHandler — Responsável pela verificação de credenciais.
 *
 * Opcionalidade: Retorna os dados do usuário após uma autenticação bem-sucedida,
 * que seria normalmente recebido por um Controller (API) para emissão de JWT.
 */
export class AuthenticateUserHandler
  implements ICommandHandler<AuthenticateUserCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async handle(
    command: AuthenticateUserCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    // 1. Criar e validar instancia de Email
    const emailResult = Email.create(command.email)
    if (!emailResult.ok) {
      return R.fail(new InvalidCredentialsError())
    }

    const email = emailResult.value

    // 2. Busca o usuário por e-mail E Tenant
    const user = await this.userRepository.findByEmail(email, tenantId)
    if (!user) {
      return R.fail(new InvalidCredentialsError())
    }

    // 3. Validações de estado (Inactive)
    if (!user.isActive) {
      return R.fail(new UserInactiveError())
    }

    // 4. Checa o Password
    const isValid = await this.passwordHasher.verify(
      command.password,
      user.passwordHash.value,
    )

    if (!isValid) {
      return R.fail(new InvalidCredentialsError())
    }

    // 5. Retorna dto via Application Mapper
    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
