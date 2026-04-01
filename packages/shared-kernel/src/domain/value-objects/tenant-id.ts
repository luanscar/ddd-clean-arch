import { UniqueEntityId } from './unique-entity-id.js'
import type { EntityId } from './unique-entity-id.js'

/**
 * TenantId — Identificador único de um inquilino (Câmara, Empresa, Org).
 *
 * Em DDD, o TenantId é o discriminador que garante o isolamento lógico
 * entre diferentes clientes rodando na mesma infraestrutura.
 */
export class TenantId extends UniqueEntityId {
  /**
   * Crea um TenantId a partir de uma string UUID ou gera um novo.
   * Nota: Usamos o tipo de retorno específico para facilitar o uso no domínio.
   */
  static override create(id?: string): any {
    const res = UniqueEntityId.create(id)
    if (res.ok) {
        return new TenantId(res.value.value as EntityId)
    }
    return res
  }

  /**
   * Factory para reconstrução (sem validação, assume-se que o ID já existe ou é válido).
   */
  static override reconstruct(id: string): TenantId {
    return new TenantId(id as EntityId)
  }

  /**
   * Tenant "Padrão" para sistemas Single-Tenant ou migrações.
   */
  static default(): TenantId {
    return new TenantId('00000000-0000-0000-0000-000000000000' as EntityId)
  }

  toString(): string {
    return this.value
  }
}
