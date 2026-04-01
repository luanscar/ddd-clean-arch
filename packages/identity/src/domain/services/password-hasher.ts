import type { HashedPassword } from '../value-objects/password-hash.js'

/**
 * IPasswordHasher — Domain Service interface para hashing de senhas.
 *
 * O domínio define o CONTRATO; a implementação concreta (bcrypt, argon2, etc.)
 * fica em `infrastructure/` e é injetada via DI (Inversão de Dependência / DIP).
 *
 * Nunca importe bcrypt, argon2 ou qualquer lib de hashing aqui.
 *
 * @example
 *   // Infrastructure:
 *   class BcryptPasswordHasher implements IPasswordHasher {
 *     async hash(plain: string): Promise<HashedPassword> {
 *       return bcrypt.hash(plain, 12) as Promise<HashedPassword>
 *     }
 *     async verify(plain: string, hashed: HashedPassword): Promise<boolean> {
 *       return bcrypt.compare(plain, hashed)
 *     }
 *   }
 */
export interface IPasswordHasher {
  /**
   * Gera o hash de uma senha em texto puro.
   * @param plainText - Senha em texto puro (nunca persistir este valor)
   */
  hash(plainText: string): Promise<HashedPassword>

  /**
   * Verifica se a senha em texto puro corresponde ao hash armazenado.
   * @returns `true` se a senha bate com o hash; `false` caso contrário.
   */
  verify(plainText: string, hashed: HashedPassword): Promise<boolean>
}
