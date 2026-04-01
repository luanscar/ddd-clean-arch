import type { IQueryHandler, Result, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
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
      // Retornar um erro de domínio ou null dependendo da convenção. 
      // Aqui vamos seguir a assinatura original que o usuário tinha (Result).
      return R.fail({ message: 'User not found', code: 'USER_NOT_FOUND' } as any)
    }

    // Retorna DTO via Application Mapper
    return R.ok(UserDtoMapper.instance.toDTO(user))
  }
}
