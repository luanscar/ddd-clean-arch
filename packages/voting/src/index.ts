// ─── Domain ──────────────────────────────────────────────────────────────────

export { Poll } from './domain/poll.js'
export type { PollState } from './domain/poll.js'
export { Vote } from './domain/vote.js'
export type { VoteState } from './domain/vote.js'

// Value Objects
export { PollStatus } from './domain/value-objects/poll-status.js'
export { createPollOption } from './domain/value-objects/poll-option.js'
export type { PollOption } from './domain/value-objects/poll-option.js'
export type { TallyResult } from './domain/value-objects/tally-result.js'

// Errors
export { AlreadyVotedError } from './domain/errors/already-voted-error.js'
export { InvalidOptionError } from './domain/errors/invalid-option-error.js'
export { InvalidPollStateError } from './domain/errors/invalid-poll-state-error.js'
export { PollNotOpenError } from './domain/errors/poll-not-open-error.js'

// Events
export { PollCreatedEvent } from './domain/events/poll-created-event.js'
export { PollOpenedEvent } from './domain/events/poll-opened-event.js'
export { PollClosedEvent } from './domain/events/poll-closed-event.js'
export { VoteCastEvent } from './domain/events/vote-cast-event.js'

// Repositories
export type { IPollRepository, FindPollsParams } from './domain/repositories/poll-repository.js'
export { InMemoryPollRepository } from './infrastructure/repositories/in-memory-poll.repository.js'

// ─── Application ─────────────────────────────────────────────────────────────

// Data Transfer Objects
export type { PollDTO } from './application/dtos/poll.dto.js'

// Mappers
export { PollMapper } from './application/mappers/poll.mapper.js'
export { PollPersistenceMapper } from './infrastructure/mappers/poll-persistence.mapper.js'

// Command Handlers
export { CreatePollHandler } from './application/commands/create-poll.handler.js'
export type { CreatePollCommand } from './application/commands/create-poll.handler.js'

export { CastVoteHandler } from './application/commands/cast-vote.handler.js'
export type { CastVoteCommand } from './application/commands/cast-vote.handler.js'

export { OpenPollHandler } from './application/commands/open-poll.handler.js'
export type { OpenPollCommand } from './application/commands/open-poll.handler.js'

export { ClosePollHandler } from './application/commands/close-poll.handler.js'
export type { ClosePollCommand } from './application/commands/close-poll.handler.js'

// Query Handlers
export { GetPollByIdHandler } from './application/queries/get-poll-by-id.handler.js'
export type { GetPollByIdQuery } from './application/queries/get-poll-by-id.handler.js'
