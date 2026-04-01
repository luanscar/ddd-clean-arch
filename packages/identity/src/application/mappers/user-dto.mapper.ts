import type { User } from '../../domain/user.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'
import type { IDtoMapper } from '@repo/shared-kernel'

/**
 * UserDtoMapper — Converte o Agregado User em um Perfil de Saída (DTO).
 * Reside na camada de Aplicação porque define o que é exposto para a API.
 */
export class UserDtoMapper implements IDtoMapper<User, UserProfileDTO> {
  toDTO(user: User): UserProfileDTO {
    return {
      id: user.id.value,
      email: user.email.value,
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
