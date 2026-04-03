import { AggregateRoot, TenantId, ValidationError } from '@repo/shared-kernel'
import type { TenantStatusValue } from './tenant-status.js'
import { TenantStatus } from './tenant-status.js'

interface TenantState {
  displayName: string
  status: TenantStatusValue
  readonly createdAt: Date
  updatedAt: Date
}

/**
 * Inquilino da plataforma — organização com isolamento lógico (`TenantId`).
 * O identificador do agregado é o mesmo `TenantId` usado como discriminador nos outros contextos.
 */
export class Tenant extends AggregateRoot<TenantId> {
  private _state: TenantState

  private constructor(id: TenantId, state: TenantState) {
    super(id, id)
    this._state = state
  }

  get displayName(): string {
    return this._state.displayName
  }

  get status(): TenantStatusValue {
    return this._state.status
  }

  get createdAt(): Date {
    return this._state.createdAt
  }

  isOperational(): boolean {
    return this._state.status === TenantStatus.ACTIVE
  }

  rename(displayName: string, now: Date): void {
    const trimmed = displayName.trim()
    if (trimmed.length === 0) {
      throw new ValidationError('Tenant displayName cannot be empty', {
        field: 'displayName',
      })
    }
    this._state = { ...this._state, displayName: trimmed, updatedAt: now }
  }

  suspend(now: Date): void {
    if (this._state.status === TenantStatus.SUSPENDED) {
      return
    }
    this._state = { ...this._state, status: TenantStatus.SUSPENDED, updatedAt: now }
  }

  activate(now: Date): void {
    if (this._state.status === TenantStatus.ACTIVE) {
      return
    }
    this._state = { ...this._state, status: TenantStatus.ACTIVE, updatedAt: now }
  }

  static create(props: { id: TenantId; displayName: string; now: Date }): Tenant {
    const trimmed = props.displayName.trim()
    if (trimmed.length === 0) {
      throw new ValidationError('Tenant displayName cannot be empty', {
        field: 'displayName',
      })
    }
    const state: TenantState = {
      displayName: trimmed,
      status: TenantStatus.ACTIVE,
      createdAt: props.now,
      updatedAt: props.now,
    }
    return new Tenant(props.id, state)
  }

  static restore(props: {
    id: TenantId
    displayName: string
    status: TenantStatusValue
    createdAt: Date
    updatedAt: Date
  }): Tenant {
    return new Tenant(props.id, {
      displayName: props.displayName,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    })
  }
}
