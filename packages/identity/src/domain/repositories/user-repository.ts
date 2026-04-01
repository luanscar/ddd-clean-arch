import type { IRepository } from '@repo/shared-kernel'
import type { Email, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { User } from '../user.js'

/**
 * IUserRepository — Interface de repositório do Bounded Context de Identity.
 *
 * Estende o contrato genérico `IRepository<User, UniqueEntityId>` e adiciona
 * queries específicas do domínio de identidade.
 *
 * A implementação concreta (Prisma, TypeORM, in-memory) fica em `infrastructure/`.
 */
export interface IUserRepository extends IRepository<User, UniqueEntityId> {
  /**
   * Busca um usuário pelo endereço de e-mail.
   * Retorna `null` se não encontrado (sem lançar NotFoundError — decisão da use case).
   */
  findByEmail(email: Email, tenantId: TenantId): Promise<User | null>
}
