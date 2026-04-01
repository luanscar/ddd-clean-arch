// Domain
export * from './domain/user.js'
export * from './domain/user-status.js'

// Domain Value Objects
export * from './domain/value-objects/password-hash.js'
export * from './domain/value-objects/role.js'

// Domain Events
export * from './domain/events/user-registered-event.js'
export * from './domain/events/user-deactivated-event.js'

// Domain Errors
export * from './domain/errors/user-already-exists-error.js'
export * from './domain/errors/user-not-found-error.js'
export * from './domain/errors/user-inactive-error.js'
export * from './domain/errors/invalid-credentials-error.js'

// Domain Service & Repository Interfaces
export * from './domain/services/password-hasher.js'
export * from './domain/repositories/user-repository.js'

// Application DTOs
export * from './application/dtos/user-profile.dto.js'

// Application Commands
export * from './application/commands/register-user.command.js'
export * from './application/commands/register-user.handler.js'
export * from './application/commands/authenticate-user.command.js'
export * from './application/commands/authenticate-user.handler.js'

// Application Queries
export * from './application/queries/get-user-profile.query.js'
export * from './application/queries/get-user-profile.handler.js'

// Infrastructure
export * from './infrastructure/mappers/user.mapper.js'
export * from './infrastructure/repositories/in-memory-user.repository.js'
export * from './infrastructure/repositories/user-persistence.js'
export * from './infrastructure/services/in-memory-password-hasher.js'
