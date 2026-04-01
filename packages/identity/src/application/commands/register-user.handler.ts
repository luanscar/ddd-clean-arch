import type { Result } from '@repo/shared-kernel/helpers'
import { Result as R } from '@repo/shared-kernel/helpers'
import { Email } from '@repo/shared-kernel/domain'
import type { ICommandHandler } from '@repo/shared-kernel/application'
import type { DomainError } from '@repo/shared-kernel/domain'
import { User } from '../../domain/user.js'
import { PasswordHash } from '../../domain/value-objects/password-hash.js'
import { Role } from '../../domain/value-objects/role.js'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists-error.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { UserMapper } from '../../infrastructure/mappers/user.mapper.js'
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
 *
 * NÃO despacha Domain Events — isso é responsabilidade do repositório
 * após o commit bem-sucedido.
 */
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async handle(
    command: RegisterUserCommand,
  ): Promise<Result<UserProfileDTO, DomainError>> {
    // 1. Validar e-mail
    const emailResult = Email.create(command.email)
    if (!emailResult.ok) return emailResult

    // 2. Validar role (se fornecida)
    const roleResult = command.role
      ? Role.create(command.role)
      : R.ok(Role.member())
    if (!roleResult.ok) return roleResult

    // 3. Verificar unicidade do e-mail
    const existing = await this.userRepository.findByEmail(emailResult.value)
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
    })

    // 6. Persistir
    await this.userRepository.save(user)

    // 7. Retornar DTO via Mapper (ACL)
    return R.ok(UserMapper.instance.toDTO(user))
  }
}
