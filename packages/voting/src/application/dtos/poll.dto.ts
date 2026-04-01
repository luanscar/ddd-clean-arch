import type { PollOption } from '../../domain/value-objects/poll-option.js'
import type { PollStatus } from '../../domain/value-objects/poll-status.js'
import type { TallyResult } from '../../domain/value-objects/tally-result.js'

export interface PollDTO {
  id: string
  title: string
  status: PollStatus
  allowedOptions: PollOption[]
  voteCount: number
  tally?: TallyResult
  createdAt: string
  openedAt?: string | null
  closedAt?: string | null
}
