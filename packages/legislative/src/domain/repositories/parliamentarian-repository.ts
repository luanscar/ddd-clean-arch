import type { IRepository, UniqueEntityId, TenantId, PaginatedDTO } from '@repo/shared-kernel'
import type { Parliamentarian } from '../parliamentarian.js'

export interface FindParliamentariansParams {
  tenantId: TenantId
  page?: number
  limit?: number
  /** Quando `true`, inclui parlamentares com `active: false` (auditoria / admin). */
  includeInactive?: boolean
}

export interface IParliamentarianRepository extends IRepository<Parliamentarian, UniqueEntityId> {
  /** Mandato ativo (padrão para votação e atos de plenário). */
  findByUserId(userId: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null>
  /** Qualquer estado — ex.: verificar duplicidade no registo. */
  findByUserIdAnyStatus(userId: UniqueEntityId, tenantId: TenantId): Promise<Parliamentarian | null>
  findMany(params: FindParliamentariansParams): Promise<PaginatedDTO<Parliamentarian>>
  /** Parlamentares com `active: true` no tenant (denominador de quórum MVP). */
  countActiveByTenant(tenantId: TenantId): Promise<number>
}
