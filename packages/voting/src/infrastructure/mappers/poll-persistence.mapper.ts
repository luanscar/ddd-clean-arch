import { UniqueEntityId, TenantId } from '@repo/shared-kernel'
import type { IPersistenceMapper } from '@repo/shared-kernel'
import { Poll } from '../../domain/poll.js'
import { Vote } from '../../domain/vote.js'
import type { PollPersistence } from '../repositories/poll-persistence.js'
import { createPollOption } from '../../domain/value-objects/poll-option.js'
import type { PollOption } from '../../domain/value-objects/poll-option.js'

function mustPollOption(raw: string): PollOption {
  const r = createPollOption(raw)
  if (!r.ok) {
    throw r.error
  }
  return r.value
}

export class PollPersistenceMapper implements IPersistenceMapper<Poll, PollPersistence> {
  toDomain(raw: PollPersistence): Poll {
    const id = UniqueEntityId.reconstruct(raw.id)
    const tenantId = TenantId.reconstruct(raw.tenantId)

    const votes = raw.votes.map((v) =>
      Vote.reconstitute(UniqueEntityId.reconstruct(v.id), {
        voterId: UniqueEntityId.reconstruct(v.voterId),
        option: mustPollOption(v.option),
        occurredOn: v.castAt,
      }),
    )

    return Poll.reconstitute(id, tenantId, {
      title: raw.title,
      status: raw.status,
      allowedOptions: raw.allowedOptions.map(mustPollOption),
      votes,
      createdAt: raw.createdAt,
      openedAt: raw.openedAt,
      closedAt: raw.closedAt,
    })
  }

  toPersistence(poll: Poll): PollPersistence {
    const state = poll.toState()
    return {
      id: poll.id.value,
      tenantId: poll.tenantId.value,
      title: state.title,
      status: state.status,
      allowedOptions: state.allowedOptions,
      createdAt: state.createdAt,
      updatedAt: new Date(), // Simulado
      openedAt: state.openedAt,
      closedAt: state.closedAt,
      votes: state.votes.map((v) => {
        const vState = v.toState()
        return {
          id: v.id.value,
          voterId: vState.voterId.value,
          option: vState.option,
          castAt: vState.occurredOn,
        }
      }),
    }
  }

  toDomainList(persistenceList: PollPersistence[]): Poll[] {
    return persistenceList.map((p) => this.toDomain(p))
  }

  toPersistenceList(domainList: Poll[]): PollPersistence[] {
    return domainList.map((d) => this.toPersistence(d))
  }

  private static _instance: PollPersistenceMapper
  static get instance(): PollPersistenceMapper {
    if (!this._instance) this._instance = new PollPersistenceMapper()
    return this._instance
  }
}
