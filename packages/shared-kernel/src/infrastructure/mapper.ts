/**
 * IMapper<Domain, Persistence, DTO> — Interface base para o padrão Anti-Corruption Layer.
 *
 * O Mapper é a fronteira explícita entre o modelo de domínio puro e os
 * modelos externos (ORM, HTTP response, GraphQL, etc.), impedindo que
 * detalhes de infra "vazem" para o domínio.
 *
 * Princípio de Separação:
 *  - `toDomain`      → infra/persistência → modelo de domínio rico
 *  - `toPersistence` → modelo de domínio → formato do banco (ORM entity/raw)
 *  - `toDTO`         → modelo de domínio → representação de saída da API
 *
 * @param Domain      - Tipo do modelo de domínio (Entidade, Agregado ou VO)
 * @param Persistence - Tipo do modelo de persistência (ORM entity, raw DB row, etc.)
 * @param DTO         - Tipo da representação de saída (HTTP response, GraphQL type, etc.)
 *                      Padrão: igual a Domain se não especificado.
 *
 * @example
 *   class UserMapper implements IMapper<User, UserOrmEntity, UserResponseDTO> {
 *     toDomain(raw: UserOrmEntity): User {
 *       const id = UniqueEntityId.reconstruct(raw.id)
 *       const email = Email.create(raw.email)
 *       // ...
 *       return User.reconstruct(id, { email, name: raw.name })
 *     }
 *
 *     toPersistence(user: User): UserOrmEntity {
 *       return { id: user.id.toString(), email: user.email.value, ... }
 *     }
 *
 *     toDTO(user: User): UserResponseDTO {
 *       return { id: user.id.toString(), email: user.email.value, ... }
 *     }
 *   }
 */
export interface IMapper<Domain, Persistence, DTO = Domain> {
  /** Reconstrói o modelo de domínio a partir da representação de persistência. */
  toDomain(persistence: Persistence): Domain

  /** Converte o modelo de domínio para a representação de persistência. */
  toPersistence(domain: Domain): Persistence

  /** Converte o modelo de domínio para o DTO de saída (HTTP/API). */
  toDTO(domain: Domain): DTO
}

/**
 * ICollectionMapper<Domain, Persistence, DTO> — Extensão para mapeamento em lote.
 *
 * Útil quando a conversão em lote pode ser otimizada (ex: batch query de JOIN).
 */
export interface ICollectionMapper<Domain, Persistence, DTO = Domain>
  extends IMapper<Domain, Persistence, DTO> {
  toDomainList(persistenceList: Persistence[]): Domain[]
  toPersistenceList(domainList: Domain[]): Persistence[]
  toDTOList(domainList: Domain[]): DTO[]
}

/**
 * AbstractMapper<Domain, Persistence, DTO> — Implementação base que fornece
 * `toDomainList`, `toPersistenceList` e `toDTOList` automaticamente,
 * delegando para os métodos singulares.
 *
 * Subclasses implementam apenas `toDomain`, `toPersistence` e `toDTO`.
 */
export abstract class AbstractMapper<Domain, Persistence, DTO = Domain>
  implements ICollectionMapper<Domain, Persistence, DTO>
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
