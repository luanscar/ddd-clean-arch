import type { Result } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import { AggregateRoot, UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { Email, Cpf } from '@repo/shared-kernel'
import type { PasswordHash } from './value-objects/password-hash.js'
import { Role } from './value-objects/role.js'
import type { UserStatusValue } from './user-status.js'
import { UserStatus } from './user-status.js'
import { UserRegisteredEvent } from './events/user-registered-event.js'
import { UserDeactivatedEvent } from './events/user-deactivated-event.js'
import { UserInactiveError } from './errors/user-inactive-error.js'
import * as crypto from 'node:crypto'

// ─── State interface (interna ao agregado) ────────────────────────────────────

interface UserState {
  email?: Email
  passwordHash?: PasswordHash
  cpf?: Cpf
  pinHash?: PasswordHash  // Reutilizamos PasswordHash para o PIN hashado
  role: Role
  status: UserStatusValue
  readonly createdAt: Date
  updatedAt: Date
}

// ─── User Aggregate Root ──────────────────────────────────────────────────────

/**
 * User — Agregado raiz do Bounded Context de Identity.
 */
export class User extends AggregateRoot<UniqueEntityId> {
  private _state: UserState

  private constructor(id: UniqueEntityId, tenantId: TenantId, state: UserState) {
    super(id, tenantId)
    this._state = state
    this.validateInvariants()
  }

  private validateInvariants(): void {
    if (!this._state.email && !this._state.cpf) {
      throw new Error('User must have at least an email or a CPF')
    }
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  get email(): Email | undefined {
    return this._state.email
  }

  get cpf(): Cpf | undefined {
    return this._state.cpf
  }

  get passwordHash(): PasswordHash | undefined {
    return this._state.passwordHash
  }

  get pinHash(): PasswordHash | undefined {
    return this._state.pinHash
  }

  get role(): Role {
    return this._state.role
  }

  get status(): UserStatusValue {
    return this._state.status
  }

  get createdAt(): Date {
    return this._state.createdAt
  }

  get updatedAt(): Date {
    return this._state.updatedAt
  }

  get isActive(): boolean {
    return this._state.status === UserStatus.ACTIVE
  }

  // ─── Factory Methods ───────────────────────────────────────────────────────

  /**
   * Cria um novo usuário via E-mail e Senha.
   */
  static create(props: {
    email: Email
    passwordHash: PasswordHash
    role?: Role
    tenantId: TenantId
    now: Date
  }): User {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const state: UserState = {
      email: props.email,
      passwordHash: props.passwordHash,
      role: props.role ?? Role.member(),
      status: UserStatus.ACTIVE,
      createdAt: props.now,
      updatedAt: props.now,
    }

    const user = new User(id, props.tenantId, state)

    user.addDomainEvent(
      new UserRegisteredEvent(id, props.email, state.role.value, props.now),
    )

    return user
  }

  /**
   * Cria um novo usuário via CPF e PIN (Padrão para Totens/Parlamentares).
   */
  static createWithCpf(props: {
    cpf: Cpf
    pinHash: PasswordHash
    role?: Role
    tenantId: TenantId
    now: Date
  }): User {
    const id = UniqueEntityId.reconstruct(crypto.randomUUID())

    const state: UserState = {
      cpf: props.cpf,
      pinHash: props.pinHash,
      role: props.role ?? Role.member(),
      status: UserStatus.ACTIVE,
      createdAt: props.now,
      updatedAt: props.now,
    }

    const user = new User(id, props.tenantId, state)

    // Nota: UserRegisteredEvent pode precisar ser expandido ou ter uma versão para CPF
    // Por enquanto, usamos um marcador genérico no log se necessário.
    user.addDomainEvent(
      new UserRegisteredEvent(id, { value: props.cpf.value } as any, state.role.value, props.now),
    )

    return user
  }

  /**
   * Reconstrói o agregado a partir da persistência sem emitir eventos.
   */
  static reconstitute(
    id: UniqueEntityId,
    tenantId: TenantId,
    state: UserState,
  ): User {
    return new User(id, tenantId, state)
  }

  // ─── Domain Behavior ───────────────────────────────────────────────────────

  changePassword(newHash: PasswordHash, now: Date): Result<void, UserInactiveError> {
    if (!this.isActive) {
      return R.fail(new UserInactiveError())
    }
    this._state.passwordHash = newHash
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  changePin(newPinHash: PasswordHash, now: Date): Result<void, UserInactiveError> {
    if (!this.isActive) {
      return R.fail(new UserInactiveError())
    }
    this._state.pinHash = newPinHash
    this._state.updatedAt = now
    return R.ok(undefined)
  }

  deactivate(now: Date): Result<void, UserInactiveError> {
    if (!this.isActive) {
      return R.fail(new UserInactiveError())
    }
    this._state.status = UserStatus.INACTIVE
    this._state.updatedAt = now
    this.addDomainEvent(new UserDeactivatedEvent(this.id, now))
    return R.ok(undefined)
  }

  activate(now: Date): void {
    this._state.status = UserStatus.ACTIVE
    this._state.updatedAt = now
  }

  toState(): Readonly<UserState> {
    return { ...this._state }
  }
}
