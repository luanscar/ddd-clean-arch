import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import type { HashedPassword } from '../../domain/value-objects/password-hash.js'

/**
 * InMemoryPasswordHasher — Implementação "fake" para testes.
 * NUNCA USE EM PRODUÇÃO (sempre implemente bcrypt ou argon2).
 */
export class InMemoryPasswordHasher implements IPasswordHasher {
  async hash(plainText: string): Promise<HashedPassword> {
    // Apenas simula um hash concatenando uma prefixo
    return `hashed_${plainText}` as HashedPassword
  }

  async verify(plainText: string, hashed: HashedPassword): Promise<boolean> {
    return `hashed_${plainText}` === hashed
  }
}
