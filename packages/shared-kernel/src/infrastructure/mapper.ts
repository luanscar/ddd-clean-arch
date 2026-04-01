/**
 * IPersistenceMapper<Domain, Persistence> — Mapeador de Infraestrutura/Banco.
 *
 * Responsável por converter entre o Modelo de Domínio e o Modelo de Persistência (OR-M).
 * Residência Sugerida: Camada de Infrastructure do Bounded Context.
 */
export interface IPersistenceMapper<Domain, Persistence> {
  /** Reconstrói o modelo de domínio a partir da representação de persistência (DB -> Domain). */
  toDomain(persistence: Persistence): Domain

  /** Converte o modelo de domínio para a representação de persistência (Domain -> DB). */
  toPersistence(domain: Domain): Persistence
}

/**
 * IDtoMapper<Domain, DTO> — Mapeador de Aplicação/Interface.
 *
 * Responsável por converter o Agregado/Entidade em um Objeto de Transferência (DTO).
 * Residência Sugerida: Camada de Application do Bounded Context.
 */
export interface IDtoMapper<Domain, DTO> {
  /** Converte o modelo de domínio para o DTO de saída (Domain -> API Response). */
  toDTO(domain: Domain): DTO
}

/**
 * Mappers Legados ou Unificados podem implementar ambos, mas a prática 
 * recomendada em DDD Senior é separá-los para evitar dependências circulares
 * ou vazamento de lógica de API para a Camada de Infraestrutura.
 */
export interface IMapper<Domain, Persistence, DTO = Domain> 
  extends IPersistenceMapper<Domain, Persistence>, IDtoMapper<Domain, DTO> {}

/**
 * AbstractMapper<Domain, Persistence, DTO> — Utilitário para mapeamento em lote.
 */
export abstract class AbstractMapper<Domain, Persistence, DTO = Domain>
  implements IMapper<Domain, Persistence, DTO>
{
  abstract toDomain(persistence: Persistence): Domain
  abstract toPersistence(domain: Domain): Persistence
  abstract toDTO(domain: Domain): DTO

  toDomainList(persistenceList: Persistence[]): Domain[] {
    return persistenceList.map((p) => this.toDomain(p))
  }

  toPersistenceList(domainList: Domain[]): Persistence[] {
    return domainList.map((d) => this.toPersistence(d))
  }

  toDTOList(domainList: Domain[]): DTO[] {
    return domainList.map((d) => this.toDTO(d))
  }
}
