import type { TenantId } from '@repo/shared-kernel'

export interface GetTenantQuery {
  /** Se omitido, o handler deve usar `ITenantProvider.getTenantId()` (injetado). */
  tenantId?: TenantId
}
