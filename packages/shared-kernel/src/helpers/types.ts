/**
 * Brand<T, B> — Branded / Nominal type para identidade de tipo estrita.
 *
 * Impede que tipos estruturalmente idênticos sejam atribuídos entre si,
 * tornando erros semânticos detectáveis em tempo de compilação.
 *
 * @example
 *   type UserId  = Brand<string, 'UserId'>
 *   type OrderId = Brand<string, 'OrderId'>
 *   // UserId e OrderId não são atribuíveis entre si
 */
export type Brand<T, B extends string> = T & { readonly __brand: B }

/**
 * Nominal — alias semântico para Brand.
 * Prefira quando o foco é na distinção de domínio, não na "marcação" técnica.
 */
export type Nominal<T, B extends string> = Brand<T, B>

/**
 * DeepReadonly<T> — Torna todas as propriedades recursivamente somente-leitura.
 * Ideal para garantir imutabilidade de Props em Value Objects.
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T

/**
 * DeepPartial<T> — Torna todas as propriedades recursivamente opcionais.
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

/**
 * Optional<T, K> — Torna apenas as chaves especificadas opcionais,
 * mantendo as demais obrigatórias.
 *
 * @example
 *   type User = { id: string; name: string; age: number }
 *   type WithOptionalAge = Optional<User, 'age'>
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Prettify<T> — Expande objetos compostos (Intersection Types) para
 * melhor legibilidade no IDE.
 *
 * @example
 *   type Merged = Prettify<{ a: string } & { b: number }>
 *   // → { a: string; b: number }
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/**
 * NonNullableProperties<T> — Remove `null` e `undefined` de todas as propriedades.
 */
export type NonNullableProperties<T> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

/**
 * ValueOf<T> — Extrai os tipos dos valores de um objeto.
 *
 * @example
 *   const STATUS = { active: 'active', inactive: 'inactive' } as const
 *   type Status = ValueOf<typeof STATUS>  // → 'active' | 'inactive'
 */
export type ValueOf<T> = T[keyof T]

/**
 * MaybeArray<T> — Aceita tanto um único valor quanto um array.
 */
export type MaybeArray<T> = T | T[]

/**
 * Awaitable<T> — Aceita tanto um valor síncrono quanto uma Promise.
 */
export type Awaitable<T> = T | Promise<T>

/**
 * Constructor<T> — Tipo para um construtor de classe concreto.
 */
export type Constructor<T = object, Args extends unknown[] = unknown[]> = new (
  ...args: Args
) => T

/**
 * AbstractConstructor<T> — Tipo para um construtor de classe abstrata.
 */
export type AbstractConstructor<T = object> = abstract new (
  ...args: unknown[]
) => T

/**
 * Discriminate<T, K, V> — Estreita uma union discriminada por chave e valor.
 *
 * @example
 *   type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; w: number; h: number }
 *   type Circle = Discriminate<Shape, 'kind', 'circle'>  // → { kind: 'circle'; radius: number }
 */
export type Discriminate<
  T,
  K extends keyof T,
  V extends T[K],
> = T extends Record<K, V> ? T : never

/**
 * Exact<T, U> — Força que U não tenha propriedades extras além de T.
 * Útil para garantir que DTOs não vazem propriedades extras.
 */
export type Exact<T, U extends T> = U & {
  [K in Exclude<keyof U, keyof T>]: never
}
