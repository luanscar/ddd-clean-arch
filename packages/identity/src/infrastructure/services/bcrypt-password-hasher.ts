import bcrypt from 'bcryptjs'
import type { IPasswordHasher } from '../../domain/services/password-hasher.js'
import { PasswordHash, type HashedPassword } from '../../domain/value-objects/password-hash.js'

/**
 * BcryptPasswordHasher — Implementação concreta de hashing.
 *
 * Utiliza o algoritmo bcrypt fortemente resistente a dicionários e força bruta.
 * Implementa a camada "Infrastructure" obedecendo o DIP (Dependency Inversion Principle)
 * ditado pelo Domínio via "IPasswordHasher".
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * @param saltRounds Opcionalidade para tuning de segurança vs performance (cost factor).
   * O padrão na indústria para bcrypt moderno é em torno de 10-12.
   */
  constructor(private readonly saltRounds: number = 10) {}

  async hash(plainText: string): Promise<HashedPassword> {
    const rawHash = await bcrypt.hash(plainText, this.saltRounds)
    const hashVO = PasswordHash.fromHash(rawHash) // encapsulado no VO
    return hashVO.value
  }

  async verify(plainText: string, hashed: HashedPassword): Promise<boolean> {
    return bcrypt.compare(plainText, hashed)
  }
}
