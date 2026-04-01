import type { IQueryHandler } from '@repo/shared-kernel'
import { UniqueEntityId } from '@repo/shared-kernel'
import { UserMapper } from '../../infrastructure/mappers/user.mapper.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { GetUserProfileQuery } from './get-user-profile.query.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * GetUserProfileHandler — Executa uma busca por ID.
 * Em CQRS puro, isso acessaria diretamente o banco de dados ignorando o agregado.
 * Aqui, pelo escopo tático, passamos pelo repositório (que busca do Domain Model),
 * mas uma segunda implementação separada apenas para queries poderia mapear do Data Model.
 */
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery, UserProfileDTO | null>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async handle(query: GetUserProfileQuery): Promise<UserProfileDTO | null> {
    const userIdResult = UniqueEntityId.create(query.userId)
    if (!userIdResult.ok) {
      return null
    }

    const user = await this.userRepository.findById(userIdResult.value)
    if (!user) {
      return null
    }

    // Retorna DTO via Mapper (ACL)
    return UserMapper.instance.toDTO(user)
  }
}
