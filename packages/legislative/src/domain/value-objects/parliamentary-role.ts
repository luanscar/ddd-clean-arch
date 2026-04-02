import type { Result } from '@repo/shared-kernel'
import { Result as R, ValueObject, ValidationError } from '@repo/shared-kernel'

export const ParliamentaryRoleValue = {
  MEMBER: 'MEMBER',
  PRESIDENT: 'PRESIDENT',
  SECRETARY: 'SECRETARY',
} as const

export type ParliamentaryRoleType = (typeof ParliamentaryRoleValue)[keyof typeof ParliamentaryRoleValue]

interface ParliamentaryRoleProps {
  readonly value: ParliamentaryRoleType
}

/**
 * ParliamentaryRole — Papel do parlamentar no processo deliberativo.
 * 
 * Diferente da Role de Identity (admin/member), esta define 
 * funções legislativas (ex: voto de minerva do Presidente).
 */
export class ParliamentaryRole extends ValueObject<ParliamentaryRoleProps> {
  get value(): ParliamentaryRoleType {
    return this.props.value
  }

  private constructor(props: ParliamentaryRoleProps) {
    super(props)
  }

  static create(raw: string): Result<ParliamentaryRole, ValidationError> {
    const validRoles = Object.values(ParliamentaryRoleValue) as string[]
    if (!validRoles.includes(raw.toUpperCase())) {
      return R.fail(
        new ValidationError(`Invalid parliamentary role "${raw}". Allowed: ${validRoles.join(', ')}`),
      )
    }
    return R.ok(new ParliamentaryRole({ value: raw.toUpperCase() as ParliamentaryRoleType }))
  }

  static member(): ParliamentaryRole {
    return new ParliamentaryRole({ value: ParliamentaryRoleValue.MEMBER })
  }

  static president(): ParliamentaryRole {
    return new ParliamentaryRole({ value: ParliamentaryRoleValue.PRESIDENT })
  }

  isPresident(): boolean {
    return this.props.value === ParliamentaryRoleValue.PRESIDENT
  }

  toString(): string {
    return this.props.value
  }
}
