import type { Result, UniqueEntityId } from '@repo/shared-kernel'
import { Result as R } from '@repo/shared-kernel'
import type { IPollRepository } from '../../domain/repositories/poll-repository.js'
import type { PollDTO } from '../dtos/poll.dto.js'
import { PollMapper } from '../mappers/poll.mapper.js'

export interface GetPollByIdQuery {
  id: UniqueEntityId
}

export class GetPollByIdHandler {
  constructor(private readonly pollRepository: IPollRepository) {}

  async execute(query: GetPollByIdQuery): Promise<Result<PollDTO, Error>> {
    const poll = await this.pollRepository.findById(query.id)

    if (!poll) {
      return R.fail(new Error(`Poll with id ${query.id.toString()} not found`))
    }

    return R.ok(PollMapper.instance.toDTO(poll))
  }
}
