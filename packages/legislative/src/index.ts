// Domain Aggregates
export * from './domain/parliamentarian.js'
export * from './domain/proposition.js'
export * from './domain/deliberative-session.js'

// Domain Value Objects
export * from './domain/value-objects/parliamentary-role.js'
export * from './domain/value-objects/proposition-status.js'

// Domain Repositories
export * from './domain/repositories/parliamentarian-repository.js'
export * from './domain/repositories/proposition-repository.js'

// Application DTOs
export * from './application/dtos/legislative.dto.js'

// Application Handlers (Commands)
export * from './application/commands/register-parliamentarian.handler.js'
export * from './application/commands/submit-proposition.handler.js'
export * from './application/commands/start-proposition-voting.handler.js'

// Application Handlers (Events)
export * from './application/event-handlers/sync-proposition-result.handler.js'

// Infrastructure
export * from './infrastructure/repositories/in-memory-parliamentarian.repository.js'
export * from './infrastructure/repositories/in-memory-proposition.repository.js'
