/**
 * Estado operacional do inquilino na plataforma.
 */
export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const

export type TenantStatusValue = (typeof TenantStatus)[keyof typeof TenantStatus]

const STATUS_VALUES: readonly TenantStatusValue[] = [
  TenantStatus.ACTIVE,
  TenantStatus.SUSPENDED,
]

export function isTenantStatusValue(value: string): value is TenantStatusValue {
  return (STATUS_VALUES as readonly string[]).includes(value)
}
