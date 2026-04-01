import type { Result } from './result.js'
import { Result as R } from './result.js'

/**
 * GuardFailure — estrutura mínima de falha retornada pelo Guard.
 * Intencionalmente desacoplada de DomainError para evitar dependências
 * circulares: helpers ← domain.
 *
 * Os Value Objects e a camada de domínio convertem GuardFailure em
 * ValidationError conforme necessário.
 */
export interface GuardFailure {
  readonly argumentName: string
  readonly message: string
}

/** Argumento nomeado para validações em lote. */
export interface GuardArgument {
  readonly value: unknown
  readonly argumentName: string
}

// ─── Guard namespace ─────────────────────────────────────────────────────────

/**
 * Guard — utilitários de pré-condição para invariantes de domínio.
 *
 * Retorna `Result<void, GuardFailure>` para integração com o Result pattern.
 * Encadeie múltiplas validações com `Guard.combine`.
 *
 * @example
 *   const nameGuard = Guard.againstNullOrUndefined(name, 'name')
 *   const ageGuard  = Guard.inRange(age, 0, 120, 'age')
 *   const combined  = Guard.combine([nameGuard, ageGuard])
 *   if (!combined.ok) throw new ValidationError(combined.error.message)
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Guard {
  /** Verifica que o valor não é `null` nem `undefined`. */
  export function againstNullOrUndefined(
    value: unknown,
    argumentName: string,
  ): Result<void, GuardFailure> {
    if (value === null || value === undefined) {
      return R.fail({ argumentName, message: `"${argumentName}" is null or undefined` })
    }
    return R.ok(undefined)
  }

  /** Verifica múltiplos argumentos contra null/undefined em sequência. */
  export function againstNullOrUndefinedBulk(
    args: GuardArgument[],
  ): Result<void, GuardFailure> {
    for (const { value, argumentName } of args) {
      const result = againstNullOrUndefined(value, argumentName)
      if (!result.ok) return result
    }
    return R.ok(undefined)
  }

  /** Verifica que um número está dentro de um intervalo inclusivo [min, max]. */
  export function inRange(
    value: number,
    min: number,
    max: number,
    argumentName: string,
  ): Result<void, GuardFailure> {
    if (value < min || value > max) {
      return R.fail({
        argumentName,
        message: `"${argumentName}" must be between ${min} and ${max}. Got ${value}`,
      })
    }
    return R.ok(undefined)
  }

  /** Verifica que uma string tem comprimento dentro do intervalo [min, max]. */
  export function againstAtLeast(
    minChars: number,
    text: string,
    argumentName: string,
  ): Result<void, GuardFailure> {
    if (text.length < minChars) {
      return R.fail({
        argumentName,
        message: `"${argumentName}" must have at least ${minChars} characters. Got ${text.length}`,
      })
    }
    return R.ok(undefined)
  }

  /** Verifica que uma string não excede o comprimento máximo. */
  export function againstAtMost(
    maxChars: number,
    text: string,
    argumentName: string,
  ): Result<void, GuardFailure> {
    if (text.length > maxChars) {
      return R.fail({
        argumentName,
        message: `"${argumentName}" must have at most ${maxChars} characters. Got ${text.length}`,
      })
    }
    return R.ok(undefined)
  }

  /** Verifica que o valor está entre os valores permitidos. */
  export function isOneOf<T>(
    value: T,
    validValues: ReadonlyArray<T>,
    argumentName: string,
  ): Result<void, GuardFailure> {
    if (!validValues.includes(value)) {
      return R.fail({
        argumentName,
        message: `"${argumentName}" must be one of [${validValues.join(', ')}]. Got "${value}"`,
      })
    }
    return R.ok(undefined)
  }

  /**
   * Combina um array de Results de Guard, retornando o primeiro erro
   * ou `ok(undefined)` se todos passarem.
   */
  export function combine(
    guardResults: ReadonlyArray<Result<void, GuardFailure>>,
  ): Result<void, GuardFailure> {
    for (const result of guardResults) {
      if (!result.ok) return result
    }
    return R.ok(undefined)
  }
}
