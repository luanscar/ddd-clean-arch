import type { Result, UniqueEntityId, DomainError } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import type { CreatePollHandler, OpenPollHandler } from '@repo/voting'
import type {
  CreateLegislativePollInput,
  ICreateLegislativePoll,
} from '../../application/ports/create-legislative-poll.port.js'

/**
 * Adapter — liga a porta do Legislative ao motor de Voting: cria urna (DRAFT) e abre (OPEN).
 */
export class VotingCreateLegislativePollAdapter implements ICreateLegislativePoll {
  constructor(
    private readonly createPollHandler: CreatePollHandler,
    private readonly openPollHandler: OpenPollHandler,
  ) {}

  async create(input: CreateLegislativePollInput): Promise<Result<UniqueEntityId, DomainError>> {
    const created = await this.createPollHandler.execute({
      title: input.title,
      allowedOptions: input.allowedOptions,
      tenantId: input.tenantId,
    })
    if (!created.ok) {
      return created
    }
    const pollId = created.value
    const opened = await this.openPollHandler.execute({
      pollId,
      tenantId: input.tenantId,
    })
    if (!opened.ok) {
      return R.fail(opened.error)
    }
    return R.ok(pollId)
  }
}
