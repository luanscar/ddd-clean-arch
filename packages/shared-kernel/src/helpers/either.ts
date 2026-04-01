/**
 * Either<L, R> — Tipo algébrico para computações bifurcadas.
 *
 * Complementa o `Result` quando ambos os lados têm valor semântico,
 * não apenas sucesso/falha. Útil em transformações de dados e pipelines
 * onde "Left" não é necessariamente um erro.
 *
 * Convenção:
 *   - Left  → valor "alternativo" (frequentemente erro, mas não obrigatório)
 *   - Right → valor "principal" (caminho feliz)
 *
 * @example
 *   function parseAge(raw: string): Either<string, number> {
 *     const n = Number(raw)
 *     return isNaN(n) ? left(`"${raw}" is not a number`) : right(n)
 *   }
 *
 *   parseAge('25').fold(
 *     err  => console.error(err),
 *     age  => console.log(age),
 *   )
 */

// ─── Abstract base ──────────────────────────────────────────────────────────

abstract class EitherBase<L, R> {
  abstract readonly isLeft: boolean
  abstract readonly isRight: boolean

  /**
   * Transforma o valor Right (functor map).
   * Propaga Left sem alteração.
   */
  abstract map<T>(fn: (r: R) => T): Either<L, T>

  /**
   * Encadeia operações sobre Right (monadic bind / flatMap).
   */
  abstract chain<T>(fn: (r: R) => Either<L, T>): Either<L, T>

  /**
   * Transforma o valor Left.
   */
  abstract mapLeft<M>(fn: (l: L) => M): Either<M, R>

  /**
   * Destrói o Either: aplica `onLeft` ou `onRight` conforme o caso.
   */
  abstract fold<T>(onLeft: (l: L) => T, onRight: (r: R) => T): T

  /**
   * Extrai o valor Right ou lança o Left como exceção.
   * Usar apenas nos limites da aplicação.
   */
  abstract unwrap(): R
}

// ─── Concrete Left ──────────────────────────────────────────────────────────

class LeftValue<L, R> extends EitherBase<L, R> {
  readonly isLeft = true as const
  readonly isRight = false as const

  constructor(public readonly value: L) {
    super()
  }

  map<T>(_fn: (r: R) => T): Either<L, T> {
    return left<L, T>(this.value)
  }

  chain<T>(_fn: (r: R) => Either<L, T>): Either<L, T> {
    return left<L, T>(this.value)
  }

  mapLeft<M>(fn: (l: L) => M): Either<M, R> {
    return left<M, R>(fn(this.value))
  }

  fold<T>(onLeft: (l: L) => T, _onRight: (r: R) => T): T {
    return onLeft(this.value)
  }

  unwrap(): R {
    throw this.value
  }
}

// ─── Concrete Right ─────────────────────────────────────────────────────────

class RightValue<L, R> extends EitherBase<L, R> {
  readonly isLeft = false as const
  readonly isRight = true as const

  constructor(public readonly value: R) {
    super()
  }

  map<T>(fn: (r: R) => T): Either<L, T> {
    return right<T, L>(fn(this.value)) as unknown as Either<L, T>
  }

  chain<T>(fn: (r: R) => Either<L, T>): Either<L, T> {
    return fn(this.value)
  }

  mapLeft<M>(_fn: (l: L) => M): Either<M, R> {
    return right<R, M>(this.value) as unknown as Either<M, R>
  }

  fold<T>(_onLeft: (l: L) => T, onRight: (r: R) => T): T {
    return onRight(this.value)
  }

  unwrap(): R {
    return this.value
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export type Either<L, R> = LeftValue<L, R> | RightValue<L, R>

/** Constrói um Left. */
export function left<L, R = never>(value: L): Either<L, R> {
  return new LeftValue<L, R>(value)
}

/** Constrói um Right. */
export function right<R, L = never>(value: R): Either<L, R> {
  return new RightValue<L, R>(value)
}

/** Type guard para Left. */
export function isLeft<L, R>(either: Either<L, R>): either is LeftValue<L, R> {
  return either.isLeft
}

/** Type guard para Right. */
export function isRight<L, R>(either: Either<L, R>): either is RightValue<L, R> {
  return either.isRight
}
