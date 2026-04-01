import type { ISpecification } from './specification.js'

/**
 * CompositeSpecification<T> — Implementação base do padrão Specification.
 *
 * Fornece as operações de composição (`and`, `or`, `not`) para que
 * subclasses implementem apenas `isSatisfiedBy` e ganhem composabilidade grátis.
 *
 * @example
 *   class IsAdultSpec extends CompositeSpecification<User> {
 *     isSatisfiedBy(user: User): boolean {
 *       return user.age >= 18
 *     }
 *   }
 *
 *   class IsVerifiedSpec extends CompositeSpecification<User> {
 *     isSatisfiedBy(user: User): boolean {
 *       return user.isEmailVerified
 *     }
 *   }
 *
 *   const canBuy = new IsAdultSpec().and(new IsVerifiedSpec())
 *   canBuy.isSatisfiedBy(user)  // true/false
 */
export abstract class CompositeSpecification<T> implements ISpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean

  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification<T>(this, other)
  }

  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification<T>(this, other)
  }

  not(): ISpecification<T> {
    return new NotSpecification<T>(this)
  }
}

// ─── Composite implementations (private, exposed only via composition) ────────

class AndSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate)
  }
}

class OrSpecification<T> extends CompositeSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate)
  }
}

class NotSpecification<T> extends CompositeSpecification<T> {
  constructor(private readonly inner: ISpecification<T>) {
    super()
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.inner.isSatisfiedBy(candidate)
  }
}
