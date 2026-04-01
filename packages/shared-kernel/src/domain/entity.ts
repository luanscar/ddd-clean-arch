import type { UniqueEntityId } from './value-objects/unique-entity-id.js'

/**
 * Entity<ID> — Classe base abstrata para Entidades DDD.
 *
 * Uma Entidade é definida pela sua **identidade**, não pelos seus atributos.
 * Dois objetos `User` com o mesmo `id` mas atributos diferentes são a mesma entidade.
 *
 * Regras de design:
 *  - `id` é imutável após construção
 *  - O estado interno pode mudar via métodos de domínio (nunca setters públicos)
 *  - Lógica de domínio pertence à entidade, não a serviços de aplicação
 *
 * @param ID - Tipo do identificador, deve ser subclasse de UniqueEntityId.
 *             Permite IDs tipados por contexto: UserId, OrderId, etc.
 *
 * @example
 *   class User extends Entity<UniqueEntityId> {
 *     constructor(id: UniqueEntityId, private _name: string) {
 *       super(id)
 *     }
 *     get name() { return this._name }
 *   }
 */
export abstract class Entity<ID extends UniqueEntityId = UniqueEntityId> {
  /**
   * Identificador imutável da entidade.
   * Acesse via getter `id` nos subtipos.
   */
  protected readonly _id: ID

  protected constructor(id: ID) {
    this._id = id
  }

  get id(): ID {
    return this._id
  }

  /**
   * Igualdade por identidade: duas entidades são iguais se e somente se
   * têm o mesmo `id`, independente do estado.
   */
  equals(other?: Entity<ID>): boolean {
    if (other === null || other === undefined) return false
    if (this === other) return true
    if (!(other instanceof Entity)) return false
    return this._id.equals(other._id)
  }
}
