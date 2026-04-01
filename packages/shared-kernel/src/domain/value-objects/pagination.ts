import type { Result } from '../../helpers/result.js'
import { Result as R } from '../../helpers/result.js'
import { Guard } from '../../helpers/guard.js'
import { ValueObject } from '../value-object.js'
import { ValidationError } from '../errors/validation-error.js'

interface PaginationProps {
  readonly page: number
  readonly limit: number
}

/**
 * Pagination — Value Object para consultas paginadas.
 *
 * Centraliza a lógica de cálculo de offset, total de páginas e
 * navegação, evitando duplicação entre use cases de listagem.
 *
 * @example
 *   const pag = Pagination.create(2, 20)
 *   if (!pag.ok) return
 *   const { offset, limit } = pag.value
 *   // offset = 20, limit = 20
 */
export class Pagination extends ValueObject<PaginationProps> {
  static readonly DEFAULT_PAGE = 1
  static readonly DEFAULT_LIMIT = 20
  static readonly MAX_LIMIT = 100

  get page(): number {
    return this.props.page
  }

  get limit(): number {
    return this.props.limit
  }

  /** Número de registros a pular na query. */
  get offset(): number {
    return (this.props.page - 1) * this.props.limit
  }

  private constructor(props: PaginationProps) {
    super(props)
  }

  static create(page: number, limit: number): Result<Pagination, ValidationError> {
    const guardResult = Guard.combine([
      Guard.inRange(page, 1, Number.MAX_SAFE_INTEGER, 'page'),
      Guard.inRange(limit, 1, Pagination.MAX_LIMIT, 'limit'),
    ])

    if (!guardResult.ok) {
      return R.fail(new ValidationError(guardResult.error.message, guardResult.error))
    }

    if (!Number.isInteger(page)) {
      return R.fail(new ValidationError('"page" must be an integer'))
    }
    if (!Number.isInteger(limit)) {
      return R.fail(new ValidationError('"limit" must be an integer'))
    }

    return R.ok(new Pagination({ page, limit }))
  }

  /** Instância padrão sem validação: page=1, limit=20. */
  static default(): Pagination {
    return new Pagination({
      page: Pagination.DEFAULT_PAGE,
      limit: Pagination.DEFAULT_LIMIT,
    })
  }

  /** Número total de páginas dado um total de registros. */
  totalPages(totalItems: number): number {
    if (totalItems <= 0) return 0
    return Math.ceil(totalItems / this.props.limit)
  }

  hasNextPage(totalItems: number): boolean {
    return this.props.page < this.totalPages(totalItems)
  }

  hasPreviousPage(): boolean {
    return this.props.page > 1
  }

  /** Navega para a próxima página (retorna nova instância). */
  next(): Pagination {
    return new Pagination({ ...this.props, page: this.props.page + 1 })
  }

  /** Navega para a página anterior (retorna nova instância, mínimo 1). */
  previous(): Pagination {
    return new Pagination({
      ...this.props,
      page: Math.max(1, this.props.page - 1),
    })
  }
}
