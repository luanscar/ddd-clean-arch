import type { User } from '../../domain/user.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * UserDtoMapper — Converte o Agregado User em um Data Transfer Object (DTO).
 * Protege o domínio de vazamento de dados sensíveis (senhas, regras internas).
 */
export class UserDtoMapper {
  /**
   * Domain Model → Application DTO
   */
  toDTO(user: User): UserProfileDTO {
    return {
      id: user.id.value,
      email: user.email?.value,
      cpf: user.cpf?.formatted, // Retorna formatado para o front-end facilitar a leitura
      role: user.role.value,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  toDTOList(users: User[]): UserProfileDTO[] {
    return users.map((u) => this.toDTO(u))
  }

  private static _instance: UserDtoMapper
  static get instance(): UserDtoMapper {
    if (!this._instance) this._instance = new UserDtoMapper()
    return this._instance
  }
}
