/**
 * ISpecification<T> — Interface do padrão Specification DDD.
 *
 * Encapsula uma regra de negócio como um objeto composável.
 * Permite construir consultas e validações complexas sem poluir
 * entidades ou serviços com múltiplas condicionais.
 *
 * @example
 *   const isActive   = new IsActiveUserSpec()
 *   const isAdult    = new IsAdultUserSpec()
 *   const isAdultActive = isActive.and(isAdult)
 *
 *   users.filter(u => isAdultActive.isSatisfiedBy(u))
 */
export interface ISpecification<T> {
  /** Verifica se o candidato satisfaz a regra encapsulada. */
  isSatisfiedBy(candidate: T): boolean

  /** Composição AND: ambas as regras devem ser satisfeitas. */
  and(other: ISpecification<T>): ISpecification<T>

  /** Composição OR: ao menos uma das regras deve ser satisfeita. */
  or(other: ISpecification<T>): ISpecification<T>

  /** Negação: a regra não deve ser satisfeita. */
  not(): ISpecification<T>
}
