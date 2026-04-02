import type {
  IQueryHandler,
  Result,
  ITenantProvider,
  DomainError,
  PaginatedDTO,
} from '@repo/shared-kernel'
import {
  Result as R,
  TenantId,
  Pagination,
  createPaginatedDTO,
} from '@repo/shared-kernel'
import { UserDtoMapper } from '../mappers/user-dto.mapper.js'
import type { IUserRepository } from '../../domain/repositories/user-repository.js'
import type { GetUsersQuery } from './get-users.query.js'
import type { UserProfileDTO } from '../dtos/user-profile.dto.js'

/**
 * GetUsersHandler — Recupera uma lista paginada de usuários de um tenant.
 */
export class GetUsersHandler
  implements IQueryHandler<GetUsersQuery, Result<PaginatedDTO<UserProfileDTO>, DomainError>>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async handle(
    query: GetUsersQuery,
  ): Promise<Result<PaginatedDTO<UserProfileDTO>, DomainError>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    // Cria o Value Object de Paginação
    const paginationResult = Pagination.create(query.page || 1, query.limit || 20)
    if (!paginationResult.ok) {
      return R.fail(paginationResult.error)
    }

    const { users, total } = await this.userRepository.findAll(
      tenantId,
      paginationResult.value,
    )

    // Converte os agregados de domínio para DTOs
    const dtos = UserDtoMapper.instance.toDTOList(users)

    // Cria o envelope paginado padrão para a API
    const response = createPaginatedDTO(dtos, paginationResult.value, total)

    return R.ok(response)
  }
}
