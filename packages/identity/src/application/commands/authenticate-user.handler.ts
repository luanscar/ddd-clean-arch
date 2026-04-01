import type { Result } from '@repo/shared-kernel/helpers'
import { Result as R } from '@repo/shared-kernel/helpers'
import { Email } from '@repo/shared-kernel/domain'
import type { ICommandHandler } from '@repo/shared-kernel/application'
import type { DomainError } from '@repo/shared-kernel/domain'
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials-error.js'
import { UserInactiveError } from '../../domain/errors/user-inactive-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserMapper } from '../../infrastructure/mappers/user.mapper.js'
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
  ) {}

  async handle(
    command: AuthenticateUserCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    // 1. Criar e validar instancia de Email
    const emailResult = Email.create(command.email)
    if (!emailResult.ok) {
      // Retornar um erro genérico ajuda na segurança (enumeração de credenciais).
      // Mas para propósitos táticos, no DDD o erro específico diz que o formato de email
      // não é apropriado. Aqui usaremos um erro generico de credenciais como fachada.
      return R.fail(new InvalidCredentialsError())
    }

    const email = emailResult.value

    // 2. Busca o usuário por e-mail
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      return R.fail(new InvalidCredentialsError()) // Generic credentials erro
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

    // 5. Retorna dto via Mapper (ACL)
    return R.ok(UserMapper.instance.toDTO(user))
  }
}
