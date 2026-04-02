import { Result } from '../../helpers/result.js'

/**
 * Cpf - Value Object representing a Brazilian CPF (Cadastro de Pessoas Físicas).
 * 
 * Rules:
 * - Must have exactly 11 digits (after removing non-numeric characters).
 * - Must pass the checksum validation algorithm.
 * - Cannot be a sequence of identical digits (e.g., 000.000.000-00).
 */
export class Cpf {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  get value(): string {
    return this._value
  }

  get formatted(): string {
    return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  static create(value: string): Result<Cpf, Error> {
    if (!value) {
      return Result.fail(new Error('CPF is required'))
    }

    const cleanCpf = value.replace(/\D/g, '')

    if (cleanCpf.length !== 11) {
      return Result.fail(new Error('CPF must have exactly 11 numeric digits'))
    }

    if (this.isAllSameDigits(cleanCpf)) {
      return Result.fail(new Error('Invalid CPF (repeated digits)'))
    }

    if (!this.isValidChecksum(cleanCpf)) {
      return Result.fail(new Error('Invalid CPF checksum'))
    }

    return Result.ok(new Cpf(cleanCpf))
  }

  /**
   * Reconstitute from storage without validation (use only for persistence).
   */
  static reconstruct(value: string): Cpf {
    return new Cpf(value)
  }

  private static isAllSameDigits(cpf: string): boolean {
    return /^(\d)\1+$/.test(cpf)
  }

  private static isValidChecksum(cpf: string): boolean {
    let sum = 0
    let rest

    // First digit check
    for (let i = 1; i <= 9; i++) {
        sum = sum + Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)
    }
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== Number.parseInt(cpf.substring(9, 10))) return false

    // Second digit check
    sum = 0
    for (let i = 1; i <= 10; i++) {
        sum = sum + Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)
    }
    rest = (sum * 10) % 11
    if (rest === 10 || rest === 11) rest = 0
    if (rest !== Number.parseInt(cpf.substring(10, 11))) return false

    return true
  }

  equals(other: Cpf): boolean {
    return this._value === other._value
  }
}
