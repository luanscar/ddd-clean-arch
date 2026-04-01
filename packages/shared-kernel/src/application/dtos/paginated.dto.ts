import type { Pagination } from '../../domain/value-objects/pagination.js'

/**
 * PaginatedMetaDTO — Representação pura dos dados auxiliares de listagem.
 */
export interface PaginatedMetaDTO {
  readonly total: number
  readonly page: number
  readonly limit: number
  readonly lastPage: number
  readonly hasNext: boolean
  readonly hasPrevious: boolean
}

/**
 * PaginatedDTO<T> — Envelope global de dados para Queries de Listagem.
 * Embala dados da camada Application para envio uniforme de API.
 *
 * T: Entidade/DTO retornada dentro do array de objetos
 */
export interface PaginatedDTO<T> {
  readonly data: T[]
  readonly meta: PaginatedMetaDTO
}

/**
 * createPaginatedDTO — Helper function
 *
 * Facilita a montagem de um Response JSON com informações ricas.
 * Recebe o próprio Value Object original (Pagination) do domínio e
 * os dados filtrados convertidos pelo mapper.
 *
 * @example
 *   const dto = createPaginatedDTO(mapper.toDTOList(users), paginationVO, totalUsersInTable)
 */
export function createPaginatedDTO<T>(
  data: T[],
  pagination: Pagination,
  totalItems: number,
): PaginatedDTO<T> {
  return {
    data,
    meta: {
      total: totalItems,
      page: pagination.page,
      limit: pagination.limit,
      lastPage: pagination.totalPages(totalItems),
      hasNext: pagination.hasNextPage(totalItems),
      hasPrevious: pagination.hasPreviousPage(),
    },
  }
}
