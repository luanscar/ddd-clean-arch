import type { UniqueEntityId, PaginatedDTO } from '@repo/shared-kernel'
import type { Poll } from '../poll.js'

export interface FindPollsParams {
  page: number
  limit: number
  status?: string
}

export interface IPollRepository {
  /**
   * Tenta encontrar uma Sessão de Votação (Poll) pelo ID.
   */
  findById(id: UniqueEntityId): Promise<Poll | null>

  /**
   * Salva a Sessão de Votação (Cria ou Atualiza).
   */
  save(poll: Poll): Promise<void>

  /**
   * Busca Sessões de Votação (Polls) paginadas.
   */
  findMany(params: FindPollsParams): Promise<PaginatedDTO<Poll>>
}
