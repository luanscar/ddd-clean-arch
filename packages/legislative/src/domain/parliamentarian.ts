import { AggregateRoot, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { ParliamentaryRole } from './value-objects/parliamentary-role.js'
import { ParliamentarianRegisteredEvent } from './events/parliamentarian-registered.event.js'
import * as crypto from 'node:crypto'

interface ParliamentarianState {
  userId: UniqueEntityId // Ligação com o contexto de Identity
  name: string
  party?: string
  role: ParliamentaryRole
  /** Soft delete: inativo não vota nem preside novas regras; registo histórico mantém-se. */
  active: boolean
  readonly createdAt: Date
  updatedAt: Date
}

/**
 * Parliamentarian - Agregado que representa um parlamentar em um Tenant específico.
 * 
 * Este agregado não trata de autenticação (delegado ao Identity), mas sim das
 * capacidades deliberativas e papéis legislativos.
 */
export class Parliamentarian extends AggregateRoot<UniqueEntityId> {
  private _state: ParliamentarianState

  private constructor(id: UniqueEntityId, tenantId: TenantId, state: ParliamentarianState) {
    super(id, tenantId)
    this._state = state
  }

  get userId(): UniqueEntityId {
    return this._state.userId
  }

  get name(): string {
    return this._state.name
  }

  get party(): string | undefined {
    return this._state.party
  }

  get role(): ParliamentaryRole {
    return this._state.role
  }

  get isPresident(): boolean {
    return this._state.role.isPresident()
  }

  get active(): boolean {
    return this._state.active
  }

  isActive(): boolean {
    return this._state.active
  }

  /**
   * Factory para novo parlamentar.
   */
  static create(props: {
    userId: UniqueEntityId
    name: string
    party?: string
    role: ParliamentaryRole
    tenantId: TenantId
    now: Date
  }): Parliamentarian {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const state: ParliamentarianState = {
      userId: props.userId,
      name: props.name,
      party: props.party,
      role: props.role,
      active: true,
      createdAt: props.now,
      updatedAt: props.now,
    }

    const parliamentarian = new Parliamentarian(id, props.tenantId, state)
    
    parliamentarian.addDomainEvent(new ParliamentarianRegisteredEvent(
      id,
      props.userId,
      props.name,
      props.role,
      props.now
    ))

    return parliamentarian
  }

  /**
   * Reconstituição da persistência.
   */
  static reconstitute(id: UniqueEntityId, tenantId: TenantId, state: ParliamentarianState): Parliamentarian {
    return new Parliamentarian(id, tenantId, state)
  }

  // ─── Comportamento de Domínio ───────────────────────────────────────────────

  changeRole(newRole: ParliamentaryRole, now: Date): void {
    this._state.role = newRole
    this._state.updatedAt = now
  }

  /**
   * Atualização parcial (nome, partido, papel legislativo, ativo).
   * Pelo menos um campo deve ser fornecido (validado na aplicação).
   */
  applyUpdate(
    patch: {
      name?: string
      party?: string | null
      role?: ParliamentaryRole
      active?: boolean
    },
    now: Date,
  ): void {
    if (patch.name !== undefined) {
      this._state.name = patch.name
    }
    if (patch.party !== undefined) {
      this._state.party = patch.party ?? undefined
    }
    if (patch.role !== undefined) {
      this._state.role = patch.role
    }
    if (patch.active !== undefined) {
      this._state.active = patch.active
    }
    this._state.updatedAt = now
  }

  deactivate(now: Date): void {
    this._state.active = false
    this._state.updatedAt = now
  }

  toState(): Readonly<ParliamentarianState> {
    return { ...this._state }
  }
}
