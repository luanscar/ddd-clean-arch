// Domain Aggregates
export * from './domain/parliamentarian.js'
export * from './domain/proposition.js'
export * from './domain/deliberative-session.js'

// Domain Value Objects
export * from './domain/value-objects/parliamentary-role.js'
export * from './domain/value-objects/proposition-status.js'
export * from './domain/value-objects/agenda-item-type.js'

export * from './domain/session-agenda-item.js'
export * from './domain/session-attendance-entry.js'

// Domain Errors
export * from './domain/errors/invalid-proposition-state-error.js'
export * from './domain/errors/parliamentarian-inactive-error.js'
export * from './domain/errors/agenda-item-not-found-error.js'
export * from './domain/errors/invalid-agenda-reorder-error.js'
export * from './domain/errors/proposition-not-on-votable-agenda-error.js'

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
export * from './application/commands/update-parliamentarian.handler.js'
export * from './application/commands/deactivate-parliamentarian.handler.js'
export * from './application/commands/submit-proposition.handler.js'
export * from './application/commands/start-proposition-voting.handler.js'
export * from './application/commands/create-deliberative-session.handler.js'
export * from './application/commands/add-proposition-to-session.handler.js'
export * from './application/commands/remove-agenda-item.handler.js'
export * from './application/commands/update-agenda-item.handler.js'
export * from './application/commands/reorder-session-agenda.handler.js'
export * from './application/commands/register-session-presence.handler.js'
export * from './application/commands/revoke-session-presence.handler.js'

// Application Handlers (Queries)
export * from './application/queries/list-deliberative-sessions.handler.js'
export * from './application/queries/get-deliberative-session.handler.js'
export * from './application/queries/list-session-attendance.handler.js'
export * from './application/queries/get-session-quorum.handler.js'
export * from './application/queries/list-parliamentarians.handler.js'
export * from './application/queries/get-parliamentarian.handler.js'
export * from './application/queries/get-proposition.handler.js'

// Application Handlers (Events)
export * from './application/event-handlers/sync-proposition-result.handler.js'

// Infrastructure adapters (integração com Voting)
export * from './infrastructure/adapters/voting-create-legislative-poll.adapter.js'
