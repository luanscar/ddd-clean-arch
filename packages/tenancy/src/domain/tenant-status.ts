/**
 * Estado operacional do inquilino na plataforma.
 */
export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const

export type TenantStatusValue = (typeof TenantStatus)[keyof typeof TenantStatus]
