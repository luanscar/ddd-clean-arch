import type { IRepository } from '@repo/shared-kernel'
import type { Email, UniqueEntityId, TenantId, Cpf } from '@repo/shared-kernel'
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
  findByEmail(email: Email, tenantId: TenantId): Promise<User | null>

  /**
   * Busca um usuário pelo CPF.
   */
  findByCpf(cpf: Cpf, tenantId: TenantId): Promise<User | null>
}
