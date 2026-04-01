import type { Brand } from '@repo/shared-kernel'
import { ValueObject } from '@repo/shared-kernel'

/**
 * HashedPassword — Brand type para distinguir senhas já hashadas de strings genéricas.
 * Garante em tempo de compilação que texto puro jamais chegue onde um hash é esperado.
 */
export type HashedPassword = Brand<string, 'HashedPassword'>

interface PasswordHashProps {
  readonly value: HashedPassword
}

/**
 * PasswordHash — Value Object que encapsula uma senha hashada.
 *
 * NÃO faz hashing — isso é responsabilidade do `IPasswordHasher` (domain service).
 * Este VO apenas garante que o valor tratado como "hash" seja opaco e tipado.
 *
 * @example
 *   const hasher: IPasswordHasher = container.resolve(IPasswordHasher)
 *   const hash = await hasher.hash('my-plain-password')
 *   const vo   = PasswordHash.fromHash(hash)
 */
export class PasswordHash extends ValueObject<PasswordHashProps> {
  get value(): HashedPassword {
    return this.props.value
  }

  private constructor(props: PasswordHashProps) {
    super(props)
  }

  /**
   * Cria um PasswordHash a partir de uma string já hashada (ex: bcrypt output).
   * Deve ser chamado apenas por `IPasswordHasher` ou pela camada de infraestrutura.
   */
  static fromHash(hash: string): PasswordHash {
    if (!hash || hash.trim().length === 0) {
      throw new Error('[PasswordHash] Hash string must not be empty')
    }
    return new PasswordHash({ value: hash as HashedPassword })
  }

  toString(): string {
    return '[REDACTED]' // Nunca expõe o hash em logs/serialização acidental
  }

  toJSON(): string {
    return '[REDACTED]'
  }
}
