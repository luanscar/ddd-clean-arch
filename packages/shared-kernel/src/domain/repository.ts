import type { AggregateRoot } from './aggregate-root.js'
import type { UniqueEntityId } from './value-objects/unique-entity-id.js'
import type { TenantId } from './value-objects/tenant-id.js'

/**
 * IRepository<T, ID> — Interface genérica de Repositório DDD.
 *
 * O Repositório abstrai a persistência de Agregados fornecendo uma coleção
 * in-memory semanticamente (o domínio "pergunta" pelo agregado sem saber onde está).
 *
 * Regras de design:
 *  - Opera apenas com `AggregateRoot`, nunca com entidades filhas diretamente
 *  - Returns `null` (ou `Result`) em vez de lançar para "não encontrado"
 *  - Não expõe detalhes de query — use `IQueryRepository` para filtros
 *  - A implementação concreta fica em `infrastructure/`
 *
 * @param T  - Tipo do Agregado
 * @param ID - Tipo do identificador do Agregado (subclasse de UniqueEntityId)
 *
 * @example
 *   interface IUserRepository extends IRepository<User, UniqueEntityId> {
 *     findByEmail(email: Email): Promise<User | null>
 *   }
 */
export interface IRepository<
  T extends AggregateRoot<ID>,
  ID extends UniqueEntityId = UniqueEntityId,
> {
  /** Busca o agregado pelo ID e Tenant. Retorna `null` se não existir. */
  findById(id: ID, tenantId: TenantId): Promise<T | null>

  /** Persiste um novo agregado ou atualiza um existente (upsert semântico). */
  save(aggregate: T): Promise<void>

  /** Remove o agregado pelo ID e Tenant. */
  delete(id: ID, tenantId: TenantId): Promise<void>

  /** Verifica se um agregado com o ID e Tenant fornecidos existe. */
  exists(id: ID, tenantId: TenantId): Promise<boolean>
}

/**
 * IQueryRepository<T, Filters, OrderBy> — Extensão para leituras com filtros.
 *
 * Separa as queries complexas do repositório de escrita (CQRS light).
 * Implementações podem usar projeções ou read models otimizados.
 *
 * @param T       - Tipo retornado (pode ser um DTO, não necessariamente o Agregado)
 * @param Filters - Estrutura de filtros disponíveis
 * @param OrderBy - Campo(s) de ordenação
 */
export interface IQueryRepository<T, Filters extends object = Record<string, never>> {
  findMany(filters: Filters): Promise<T[]>
  count(filters: Omit<Filters, 'pagination'>): Promise<number>
}
