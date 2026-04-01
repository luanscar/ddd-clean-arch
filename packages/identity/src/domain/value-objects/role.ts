import type { Result } from '@repo/shared-kernel/helpers'
import { Result as R } from '@repo/shared-kernel/helpers'
import { ValueObject, ValidationError } from '@repo/shared-kernel/domain'

/**
 * UserRole — Roles disponíveis no contexto de identidade.
 * Use `as const` + type union para ser inferível pelo TypeScript sem enum nativo.
 */
export const UserRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const

export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole]

interface RoleProps {
  readonly value: UserRoleValue
}

/**
 * Role — Value Object que encapsula o papel de um usuário no sistema.
 *
 * Criação via factory:
 *  - `Role.create(raw)`  → valida e retorna Result
 *  - `Role.admin()`      → sempre válido, sem Result
 *  - `Role.member()`     → sempre válido, sem Result
 */
export class Role extends ValueObject<RoleProps> {
  get value(): UserRoleValue {
    return this.props.value
  }

  private constructor(props: RoleProps) {
    super(props)
  }

  static create(raw: string): Result<Role, ValidationError> {
    const validRoles = Object.values(UserRole) as string[]
    if (!validRoles.includes(raw)) {
      return R.fail(
        new ValidationError(`Invalid role "${raw}". Allowed: ${validRoles.join(', ')}`),
      )
    }
    return R.ok(new Role({ value: raw as UserRoleValue }))
  }

  /** Factory conveniente — role padrão para novos usuários. */
  static member(): Role {
    return new Role({ value: UserRole.MEMBER })
  }

  static admin(): Role {
    return new Role({ value: UserRole.ADMIN })
  }

  isAdmin(): boolean {
    return this.props.value === UserRole.ADMIN
  }

  isMember(): boolean {
    return this.props.value === UserRole.MEMBER
  }

  toString(): string {
    return this.props.value
  }
}
