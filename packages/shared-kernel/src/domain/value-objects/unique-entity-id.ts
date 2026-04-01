import type { Brand } from '../../helpers/types.js'
import type { Result } from '../../helpers/result.js'
import { Result as R } from '../../helpers/result.js'
import { Guard } from '../../helpers/guard.js'
import { ValueObject } from '../value-object.js'
import { ValidationError } from '../errors/validation-error.js'

/**
 * EntityId — Brand type para diferenciar IDs de entidades de strings comuns.
 *
 * Subtipos podem especializar com seus próprios brands:
 * @example
 *   type UserId = Brand<string, 'UserId'>
 */
export type EntityId = Brand<string, 'EntityId'>

interface UniqueEntityIdProps {
  readonly value: EntityId
}

/**
 * UniqueEntityId — Value Object de identidade para Entidades e Agregados.
 *
 * Encapsula um UUID v4 gerado via `crypto.randomUUID()` (Node ≥ 18,
 * sem dependências externas).
 *
 * Criação via factory methods:
 *  - `UniqueEntityId.create()` → gera novo UUID
 *  - `UniqueEntityId.create(existingId)` → reidratica a partir de string
 *
 * @example
 *   const id = UniqueEntityId.create()          // novo UUID
 *   const id2 = UniqueEntityId.create('abc-..') // reconstrói de string
 */
export class UniqueEntityId extends ValueObject<UniqueEntityIdProps> {
  get value(): EntityId {
    return this.props.value
  }

  private constructor(id: EntityId) {
    super({ value: id })
  }

  /**
   * Cria uma nova instância.
   * @param id - UUID existente (opcional). Se omitido, gera um novo UUID v4.
   */
  static create(id?: string): Result<UniqueEntityId, ValidationError> {
    if (id !== undefined) {
      const guardResult = Guard.againstNullOrUndefined(id, 'id')
      if (!guardResult.ok) {
        return R.fail(new ValidationError(guardResult.error.message))
      }
      if (id.trim().length === 0) {
        return R.fail(new ValidationError('"id" must not be an empty string'))
      }
    }

    const entityId = (id ?? crypto.randomUUID()) as EntityId
    return R.ok(new UniqueEntityId(entityId))
  }

  /**
   * Factory conveniente que ignora erros de validação e usa o ID fornecido
   * ou gera um novo. Use apenas em testes ou em código ORM onde o ID sempre existe.
   *
   * @internal Prefira `UniqueEntityId.create()` no domínio.
   */
  static reconstruct(id: string): UniqueEntityId {
    if (!id || id.trim().length === 0) {
      throw new Error('UniqueEntityId.reconstruct: id must not be empty')
    }
    return new UniqueEntityId(id as EntityId)
  }

  toString(): string {
    return this.props.value
  }

  toJSON(): string {
    return this.props.value
  }
}
