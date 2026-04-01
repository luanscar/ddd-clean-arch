import type { Brand } from '../../helpers/types.js'
import type { Result } from '../../helpers/result.js'
import { Result as R } from '../../helpers/result.js'
import { ValueObject } from '../value-object.js'
import { ValidationError } from '../errors/validation-error.js'

/**
 * CurrencyCode — Brand type para códigos ISO 4217 (ex: 'BRL', 'USD', 'EUR').
 * Garante que apenas strings que passaram pela validação sejam aceitas.
 */
export type CurrencyCode = Brand<string, 'CurrencyCode'>

interface MoneyProps {
  readonly amount: number
  readonly currency: CurrencyCode
}

/**
 * Money — Value Object monetário imutável.
 *
 * - Todas as operações aritméticas retornam **novas instâncias** (imutabilidade)
 * - Operações entre moedas diferentes retornam `Result.fail` — nunca lançam
 * - `amount` armazena em centavos inteiros internamente para evitar float
 *
 * @example
 *   const price = Money.create(1999, 'BRL')  // R$ 19,99
 *   if (!price.ok) return
 *   const tax   = Money.create(199, 'BRL')
 *   if (!tax.ok)  return
 *   const total = price.value.add(tax.value)
 */
export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount
  }

  get currency(): CurrencyCode {
    return this.props.currency
  }

  /** Valor formatado em reais/dollars como float (amount / 100). */
  get decimalAmount(): number {
    return this.props.amount / 100
  }

  private constructor(props: MoneyProps) {
    super(props)
  }

  /**
   * @param amount  Valor em centavos (inteiro). Ex: 1999 = R$ 19,99
   * @param currency Código ISO 4217 de 3 letras (ex: 'BRL', 'USD')
   */
  static create(amount: number, currency: string): Result<Money, ValidationError> {
    if (!Number.isFinite(amount)) {
      return R.fail(new ValidationError('Money amount must be a finite number'))
    }
    if (!Number.isInteger(amount)) {
      return R.fail(
        new ValidationError('Money amount must be an integer (in cents). Got ' + amount),
      )
    }
    if (!currency || currency.trim().length !== 3) {
      return R.fail(
        new ValidationError('Currency must be a 3-letter ISO 4217 code (e.g., BRL, USD)'),
      )
    }

    return R.ok(
      new Money({ amount, currency: currency.toUpperCase() as CurrencyCode }),
    )
  }

  /** @throws {ValidationError} encapsulado em Result quando moedas diferem. */
  add(other: Money): Result<Money, ValidationError> {
    if (this.currency !== other.currency) {
      return R.fail(
        new ValidationError(
          `Cannot add Money with different currencies: ${this.currency} + ${other.currency}`,
        ),
      )
    }
    return Money.create(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Result<Money, ValidationError> {
    if (this.currency !== other.currency) {
      return R.fail(
        new ValidationError(
          `Cannot subtract Money with different currencies: ${this.currency} - ${other.currency}`,
        ),
      )
    }
    return Money.create(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Result<Money, ValidationError> {
    if (!Number.isFinite(factor)) {
      return R.fail(new ValidationError('Multiplication factor must be a finite number'))
    }
    return Money.create(Math.round(this.amount * factor), this.currency)
  }

  isGreaterThan(other: Money): boolean {
    return this.currency === other.currency && this.amount > other.amount
  }

  isLessThan(other: Money): boolean {
    return this.currency === other.currency && this.amount < other.amount
  }

  isZero(): boolean {
    return this.amount === 0
  }

  isNegative(): boolean {
    return this.amount < 0
  }

  format(locale = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.decimalAmount)
  }

  toString(): string {
    return `${this.decimalAmount.toFixed(2)} ${this.currency}`
  }
}
