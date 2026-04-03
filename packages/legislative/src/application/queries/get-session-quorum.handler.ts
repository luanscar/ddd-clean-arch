import type { Result, UniqueEntityId, ITenantProvider, DomainError } from '@repo/shared-kernel'
import { Result as R, TenantId, NotFoundError } from '@repo/shared-kernel'
import type { IDeliberativeSessionRepository } from '../../domain/repositories/deliberative-session-repository.js'
import type { IParliamentarianRepository } from '../../domain/repositories/parliamentarian-repository.js'

/** Maioria simples dos ativos: ⌊n/2⌋ + 1 presenças (MVP). */
export interface SessionQuorumReadModel {
  presentCount: number
  eligibleCount: number
  quorumRequired: number
  met: boolean
}

export interface GetSessionQuorumQuery {
  sessionId: UniqueEntityId
  tenantId?: string
}

export class GetSessionQuorumHandler {
  constructor(
    private readonly sessionRepository: IDeliberativeSessionRepository,
    private readonly parliamentarianRepository: IParliamentarianRepository,
    private readonly tenantProvider: ITenantProvider,
  ) {}

  async execute(query: GetSessionQuorumQuery): Promise<Result<SessionQuorumReadModel, DomainError>> {
    const tenantId = query.tenantId
      ? TenantId.reconstruct(query.tenantId)
      : this.tenantProvider.getTenantId()

    const session = await this.sessionRepository.findById(query.sessionId, tenantId)
    if (!session) {
      return R.fail(new NotFoundError('DeliberativeSession', query.sessionId.toString()))
    }

    const eligibleCount = await this.parliamentarianRepository.countActiveByTenant(tenantId)
    const presentCount = session.attendance.length
    const quorumRequired = eligibleCount === 0 ? 0 : Math.floor(eligibleCount / 2) + 1
    const met = eligibleCount > 0 && presentCount >= quorumRequired

    return R.ok({
      presentCount,
      eligibleCount,
      quorumRequired,
      met,
    })
  }
}
