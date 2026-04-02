// Domain Aggregates
export * from './domain/parliamentarian.js'
export * from './domain/proposition.js'
export * from './domain/deliberative-session.js'

// Domain Value Objects
export * from './domain/value-objects/parliamentary-role.js'
export * from './domain/value-objects/proposition-status.js'

// Domain Errors
export * from './domain/errors/invalid-proposition-state-error.js'

// Domain Repositories
export * from './domain/repositories/parliamentarian-repository.js'
export * from './domain/repositories/proposition-repository.js'
export * from './domain/repositories/deliberative-session-repository.js'

// Application ports
export type {
  CreateLegislativePollInput,
  ICreateLegislativePoll,
} from './application/ports/create-legislative-poll.port.js'

// Application DTOs
export * from './application/dtos/legislative.dto.js'

// Application Handlers (Commands)
export * from './application/commands/register-parliamentarian.handler.js'
export * from './application/commands/submit-proposition.handler.js'
export * from './application/commands/start-proposition-voting.handler.js'
export * from './application/commands/create-deliberative-session.handler.js'
export * from './application/commands/add-proposition-to-session.handler.js'

// Application Handlers (Queries)
export * from './application/queries/list-deliberative-sessions.handler.js'
export * from './application/queries/get-deliberative-session.handler.js'
export * from './application/queries/list-parliamentarians.handler.js'
export * from './application/queries/get-parliamentarian.handler.js'
export * from './application/queries/get-proposition.handler.js'

// Application Handlers (Events)
export * from './application/event-handlers/sync-proposition-result.handler.js'

// Infrastructure adapters (integração com Voting)
export * from './infrastructure/adapters/voting-create-legislative-poll.adapter.js'
