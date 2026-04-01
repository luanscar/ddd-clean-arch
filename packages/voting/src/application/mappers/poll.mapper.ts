import type { IDtoMapper } from '@repo/shared-kernel'
import type { Poll } from '../../domain/poll.js'
import type { PollDTO } from '../dtos/poll.dto.js'

/**
 * PollMapper — Converte o Agregado Poll em DTO de leitura.
 * Implementa IDtoMapper explicitamente para conformidade com a arquitetura.
 */
export class PollMapper implements IDtoMapper<Poll, PollDTO> {
  toDTO(poll: Poll): PollDTO {
    const state = poll.toState()
    
    return {
      id: poll.id.toString(),
      title: state.title,
      status: state.status,
      allowedOptions: state.allowedOptions,
      voteCount: state.votes.length,
      tally: poll.computeTally(),
      createdAt: state.createdAt.toISOString(),
      openedAt: state.openedAt?.toISOString() ?? null,
      closedAt: state.closedAt?.toISOString() ?? null,
    }
  }

  private static _instance: PollMapper
  static get instance(): PollMapper {
    if (!this._instance) this._instance = new PollMapper()
    return this._instance
  }
}
