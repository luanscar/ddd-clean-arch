import type { TenantId } from '../../domain/value-objects/tenant-id.js'

/**
 * ITenantProvider — Resolutor do inquilino atual na execução.
 *
 * Em DDD, este é um serviço de infraestrutura que permite que a camada de
 * aplicação determine qual o TenantId deve ser associado aos novos objetos
 * ou usado como filtro em repositórios.
 */
export interface ITenantProvider {
  /**
   * Retorna o TenantId resolvido para o contexto atual (ex: via Token, Header ou Config).
   */
  getTenantId(): TenantId

  /**
   * Alternativa assíncrona se a resolução exigir IO ou banco.
   */
  resolveTenantId(): Promise<TenantId>
}
