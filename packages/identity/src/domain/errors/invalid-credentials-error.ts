import { DomainError } from '@repo/shared-kernel/domain'

export class InvalidCredentialsError extends DomainError {
  readonly code = 'IDENTITY.INVALID_CREDENTIALS' as const

  constructor() {
    // Mensagem genérica intencional — não revela qual campo está errado (segurança)
    super('Invalid email or password')
  }
}
