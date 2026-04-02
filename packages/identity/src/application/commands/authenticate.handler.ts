import type { Result, ITenantProvider } from '@repo/shared-kernel'
import { Result as R, Email, Cpf, TenantId } from '@repo/shared-kernel'
import type { ICommandHandler } from '@repo/shared-kernel'
import type { DomainError } from '@repo/shared-kernel'
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials-error.js'
import { UserInactiveError } from '../../domain/errors/user-inactive-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { AuthenticateCommand } from './authenticate.command.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * AuthenticateHandler — Handler unificado para autenticação.
 * 
 * Este handler é responsável por identificar se o 'identifier' é um e-mail ou CPF
 * e validar as credenciais correspondentes (Password ou PIN).
 * 
 * Cumpre o papel de "Unified Identity Gateway" no domínio de Identidade.
 */
export class AuthenticateHandler
  implements ICommandHandler<AuthenticateCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async handle(
    command: AuthenticateCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    const tenantId = command.tenantId
      ? TenantId.reconstruct(command.tenantId)
      : this.tenantProvider.getTenantId()

    const { identifier, secret } = command

    // 1. Tentar identificar como E-mail
    const emailResult = Email.create(identifier)
    if (emailResult.ok) {
      return this.authenticateWithEmail(emailResult.value, secret, tenantId)
    }

    // 2. Tentar identificar como CPF
    const cpfResult = Cpf.create(identifier)
    if (cpfResult.ok) {
      return this.authenticateWithCpf(cpfResult.value, secret, tenantId)
    }

    // 3. Se nenhum formato for válido, as credenciais são inválidas por definição
    return R.fail(new InvalidCredentialsError())
  }

  private async authenticateWithEmail(
    email: Email,
    password: string,
    tenantId: TenantId,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    const user = await this.userRepository.findByEmail(email, tenantId)
    if (!user || !user.passwordHash) {
      return R.fail(new InvalidCredentialsError())
    }

    if (!user.isActive) {
      return R.fail(new UserInactiveError())
    }

    const isValid = await this.passwordHasher.verify(password, user.passwordHash.value)
    if (!isValid) {
      return R.fail(new InvalidCredentialsError())
    }

    return R.ok(UserDtoMapper.instance.toDTO(user))
  }

  private async authenticateWithCpf(
    cpf: Cpf,
    pin: string,
    tenantId: TenantId,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    const user = await this.userRepository.findByCpf(cpf, tenantId)
    if (!user || !user.pinHash) {
      return R.fail(new InvalidCredentialsError())
    }

    if (!user.isActive) {
      return R.fail(new UserInactiveError())
    }

    const isValid = await this.passwordHasher.verify(pin, user.pinHash.value)
    if (!isValid) {
      return R.fail(new InvalidCredentialsError())
    }

    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
