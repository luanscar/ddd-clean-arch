import type { PollStatus } from '../../domain/value-objects/poll-status.js'

export interface PollPersistence {
  readonly id: string
  readonly tenantId: string
  readonly title: string
  readonly allowedOptions: string[]
  readonly status: PollStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly openedAt: Date | null
  readonly closedAt: Date | null
  readonly votes: {
    readonly id: string
    readonly voterId: string
    readonly option: string
    readonly castAt: Date
  }[]
}
