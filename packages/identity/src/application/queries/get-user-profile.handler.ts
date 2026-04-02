import type { IQueryHandler, Result, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import { UserNotFoundError } from '../../domain/errors/user-not-found-error.js'
import type { GetUserProfileQuery } from './get-user-profile.query.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * GetUserProfileHandler — Recupera os dados básicos do usuário.
 *
 * NOTA: Este handler usa o Agregado de Domínio (User) por simplicidade,
 * mas uma segunda implementação separada apenas para queries poderia mapear do Data Model.
 */
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery, Result<UserProfileDTO, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async handle(query: GetUserProfileQuery): Promise<Result<UserProfileDTO, DomainError>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    const userIdResult = UniqueEntityId.create(query.userId)
    if (!userIdResult.ok) {
      return R.fail(userIdResult.error)
    }

    const user = await this.userRepository.findById(userIdResult.value, tenantId)
    if (!user) {
      return R.fail(new UserNotFoundError(query.userId))
    }

    // Retorna DTO via Application Mapper
    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
