import type { Brand } from '../../helpers/types.js'
import type { Result } from '../../helpers/result.js'
import { Result as R } from '../../helpers/result.js'
import { ValueObject } from '../value-object.js'
import { ValidationError } from '../errors/validation-error.js'

/**
 * EmailAddress — Brand type para distinguir emails validados de strings genéricas.
 * Uma função que receba `EmailAddress` sabe que o valor já foi validado.
 */
export type EmailAddress = Brand<string, 'EmailAddress'>

interface EmailProps {
  readonly value: EmailAddress
}

// RFC 5322 simplificado — suficiente para validação de domínio
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Email — Value Object para endereços de e-mail.
 *
 * - Normaliza para minúsculas e remove espaços antes/depois
 * - Valida formato com regex RFC 5322 simplificada
 * - Retorna `Result<Email, ValidationError>` — nunca lança exceção
 *
 * @example
 *   const emailResult = Email.create('User@Example.COM')
 *   if (emailResult.ok) {
 *     console.log(emailResult.value.value) // 'user@example.com'
 *   }
 */
export class Email extends ValueObject<EmailProps> {
  get value(): EmailAddress {
    return this.props.value
  }

  private constructor(props: EmailProps) {
    super(props)
  }

  static create(raw: string): Result<Email, ValidationError> {
    if (raw === null || raw === undefined) {
      return R.fail(new ValidationError('"email" is null or undefined'))
    }

    const normalized = raw.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalized)) {
      return R.fail(
        new ValidationError(`"${raw}" is not a valid email address`, { field: 'email', raw }),
      )
    }

    return R.ok(new Email({ value: normalized as EmailAddress }))
  }

  toString(): string {
    return this.props.value
  }

  toJSON(): string {
    return this.props.value
  }
}
