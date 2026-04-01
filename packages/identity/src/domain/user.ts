import type { Result } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import { AggregateRoot, UniqueEntityId } from '@repo/shared-kernel'
import type { Email } from '@repo/shared-kernel'
import type { PasswordHash } from './value-objects/password-hash.js'
import { Role } from './value-objects/role.js'
import type { UserStatusValue } from './user-status.js'
import { UserStatus } from './user-status.js'
import { UserRegisteredEvent } from './events/user-registered-event.js'
import { UserDeactivatedEvent } from './events/user-deactivated-event.js'
import { UserInactiveError } from './errors/user-inactive-error.js'

// ─── State interface (interna ao agregado) ────────────────────────────────────

interface UserState {
  email: Email
  passwordHash: PasswordHash
  role: Role
  status: UserStatusValue
  readonly createdAt: Date
  updatedAt: Date
}

// ─── User Aggregate Root ──────────────────────────────────────────────────────

/**
 * User — Agregado raiz do Bounded Context de Identity.
 *
 * Representa uma conta de usuário. Encapsula todas as regras de negócio
 * referentes a ciclo de vida, autenticação e permissões.
 *
 * Invariantes mantidas:
 *  - Um usuário inativo não pode mudar senha
 *  - Um usuário inativo não pode ser desativado novamente
 *  - Eventos de domínio são emitidos em cada mutação relevante
 *
 * Criação:
 *  - `User.create()` → novo usuário (gera ID, emite UserRegisteredEvent)
 *  - `User.reconstitute()` → reconstrução a partir da persistência (sem eventos)
 */
export class User extends AggregateRoot<UniqueEntityId> {
  private _state: UserState

  private constructor(id: UniqueEntityId, state: UserState) {
    super(id)
    this._state = state
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  get email(): Email {
    return this._state.email
  }

  get passwordHash(): PasswordHash {
    return this._state.passwordHash
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
   * Cria um novo usuário e emite `UserRegisteredEvent`.
   * A verificação de e-mail duplicado é responsabilidade do use case.
   *
   * @param email        — VO ja validado
   * @param passwordHash — VO ja hashado pelo IPasswordHasher
   * @param role         — opcional, padrão MEMBER
   */
  static create(props: {
    email: Email
    passwordHash: PasswordHash
    role?: Role
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

    const user = new User(id, state)

    user.addDomainEvent(
      new UserRegisteredEvent(id, props.email, state.role.value, props.now),
    )

    return user
  }

  /**
   * Reconstrói o agregado a partir da persistência **sem emitir eventos**.
   * Usado exclusivamente pelo `IUserRepository` (mapper de infra).
   */
  static reconstitute(
    id: UniqueEntityId,
    state: UserState,
  ): User {
    return new User(id, state)
  }

  // ─── Domain Behavior ───────────────────────────────────────────────────────

  /**
   * Troca a senha do usuário.
   * Invariante: usuário deve estar ACTIVE.
   */
  changePassword(newHash: PasswordHash, now: Date): Result<void, UserInactiveError> {
    if (!this.isActive) {
      return R.fail(new UserInactiveError())
    }

    this._state.passwordHash = newHash
    this._state.updatedAt = now

    return R.ok(undefined)
  }

  /**
   * Desativa o usuário e emite `UserDeactivatedEvent`.
   * Invariante: usuário deve estar ACTIVE.
   */
  deactivate(now: Date): Result<void, UserInactiveError> {
    if (!this.isActive) {
      return R.fail(new UserInactiveError())
    }

    this._state.status = UserStatus.INACTIVE
    this._state.updatedAt = now

    this.addDomainEvent(new UserDeactivatedEvent(this.id, now))

    return R.ok(undefined)
  }

  /**
   * Reativa um usuário inativo.
   */
  activate(now: Date): void {
    this._state.status = UserStatus.ACTIVE
    this._state.updatedAt = now
  }

  /**
   * Expõe o estado interno para reconstrução pela camada de infraestrutura.
   * Prefira os getters individuais no domínio e na aplicação.
   *
   * @internal Uso exclusivo do mapper de infraestrutura.
   */
  toState(): Readonly<UserState> {
    return { ...this._state }
  }
}
