/**
 * Result<T, E> — Padrão funcional para representar operações que podem falhar.
 *
 * Substitui o uso de `throw` como mecanismo de controle de fluxo,
 * tornando erros parte explícita da assinatura dos métodos e
 * obrigando o chamador a tratá-los.
 *
 * @example
 *   function divide(a: number, b: number): Result<number, DivisionError> {
 *     if (b === 0) return Result.fail(new DivisionError('Division by zero'))
 *     return Result.ok(a / b)
 *   }
 *
 *   const r = divide(10, 2)
 *   if (r.ok) console.log(r.value)  // 5
 *   else      console.error(r.error)
 */

// ─── Internal discriminated union types ────────────────────────────────────

type OkShape<T> = {
  readonly ok: true
  readonly value: T
  readonly error?: undefined
}

type FailShape<E> = {
  readonly ok: false
  readonly error: E
  readonly value?: undefined
}

// ─── Public union type ──────────────────────────────────────────────────────

export type Result<T, E = Error> = OkShape<T> | FailShape<E>

// Convenience aliases for narrowed branches
export type Ok<T> = OkShape<T>
export type Fail<E> = FailShape<E>

// ─── Result namespace (factory + combinators) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Result {
  /**
   * Cria um Result de sucesso carregando um valor.
   */
  export function ok<T>(value: T): Ok<T> {
    return { ok: true, value }
  }

  /**
   * Cria um Result de falha carregando um erro.
   */
  export function fail<E>(error: E): Fail<E> {
    return { ok: false, error }
  }

  /**
   * Combina múltiplos Results. Retorna o primeiro erro encontrado
   * ou `ok(undefined)` se todos forem bem-sucedidos.
   */
  export function combine<E>(results: ReadonlyArray<Result<unknown, E>>): Result<void, E> {
    for (const result of results) {
      if (!result.ok) return result as Fail<E>
    }
    return ok(undefined)
  }

  /**
   * Transforma o valor de um Result bem-sucedido (map / functor).
   * Propaga o erro sem alteração se for falha.
   */
  export function map<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => U,
  ): Result<U, E> {
    if (!result.ok) return result
    return ok(fn(result.value))
  }

  /**
   * Encadeia operações que também retornam Result (flatMap / monadic bind).
   */
  export function chain<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    if (!result.ok) return result
    return fn(result.value)
  }

  /**
   * Transforma o erro de um Result falhado (mapError).
   */
  export function mapError<T, E, F>(
    result: Result<T, E>,
    fn: (error: E) => F,
  ): Result<T, F> {
    if (result.ok) return result
    return fail(fn(result.error))
  }

  /**
   * Type guard para branch de sucesso.
   */
  export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok === true
  }

  /**
   * Type guard para branch de falha.
   */
  export function isFail<T, E>(result: Result<T, E>): result is Fail<E> {
    return result.ok === false
  }

  /**
   * Extrai o valor ou lança uma exceção — usar apenas nos limites da aplicação,
   * nunca dentro do domínio.
   */
  export function unwrap<T, E>(result: Result<T, E>): T {
    if (!result.ok) throw result.error
    return result.value
  }

  /**
   * Extrai o valor ou retorna o fallback fornecido.
   */
  export function getOrElse<T, E>(result: Result<T, E>, fallback: T): T {
    return result.ok ? result.value : fallback
  }
}
