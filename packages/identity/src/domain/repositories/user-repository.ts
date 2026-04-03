import type { IRepository, Pagination } from '@repo/shared-kernel'
import type { UniqueEntityId, Email, TenantId, Cpf } from '@repo/shared-kernel'
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

  /**
   * Verifica se um usuário existe.
   */
  exists(id: UniqueEntityId, tenantId: TenantId): Promise<boolean>

  /**
   * Busca todos os usuários de um tenant com paginação.
   */
  findAll(
    tenantId: TenantId,
    pagination: Pagination,
  ): Promise<{ users: User[]; total: number }>

  /**
   * Utilizadores ativos com papel admin no inquilino (proteção “último admin”, MVP-06).
   */
  countActiveAdmins(tenantId: TenantId): Promise<number>
}
