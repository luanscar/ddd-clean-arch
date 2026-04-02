import { Result } from '@repo/shared-kernel'

/**
 * Pin - Value Object representing a numeric 6-digit access code.
 */
export class Pin {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  get value(): string {
    return this._value
  }

  static create(value: string): Result<Pin, Error> {
    if (!value) {
      return Result.fail(new Error('PIN is required'))
    }

    const numericValue = value.replace(/\D/g, '')

    if (numericValue.length !== 6) {
      return Result.fail(new Error('PIN must have exactly 6 numeric digits'))
    }

    // Optional: Avoid very simple pins like 123456 or 111111 if requested, 
    // but for now 6 numeric digits is the only rule.
    if (/^(\d)\1+$/.test(numericValue)) {
        return Result.fail(new Error('PIN cannot be a sequence of identical digits'))
    }

    return Result.ok(new Pin(numericValue))
  }

  /**
   * Reconstitute from storage.
   */
  static reconstruct(value: string): Pin {
    return new Pin(value)
  }

  equals(other: Pin): boolean {
    return this._value === other._value
  }
}
