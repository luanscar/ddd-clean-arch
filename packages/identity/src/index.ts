// Domain
export * from './domain/user.js'
export * from './domain/user-status.js'

// Domain Value Objects
export * from './domain/value-objects/password-hash.js'
export * from './domain/value-objects/role.js'
export * from './domain/value-objects/pin.js'

// Domain Events
export * from './domain/events/user-registered-event.js'
export * from './domain/events/user-deactivated-event.js'

// Domain Errors
export * from './domain/errors/user-already-exists-error.js'
export * from './domain/errors/user-cpf-already-exists-error.js'
export * from './domain/errors/user-cpf-already-linked-error.js'
export * from './domain/errors/user-must-have-identifier-error.js'
export * from './domain/errors/user-not-found-error.js'
export * from './domain/errors/user-inactive-error.js'
export * from './domain/errors/invalid-credentials-error.js'

// Domain Service & Repository Interfaces
export * from './domain/services/password-hasher.js'
export * from './domain/repositories/user-repository.js'

// Application DTOs
export * from './application/dtos/user-profile.dto.js'

// Application Mappers
export * from './application/mappers/user-dto.mapper.js'

// Application Commands
export * from './application/commands/register-user.command.js'
export * from './application/commands/register-user.handler.js'
export * from './application/commands/authenticate-user.command.js'
export * from './application/commands/authenticate-user.handler.js'
export * from './application/commands/cpf-auth.command.js'
export * from './application/commands/register-user-with-cpf.handler.js'
export * from './application/commands/authenticate-with-cpf.handler.js'
export * from './application/commands/link-cpf.handler.js'
export * from './application/commands/authenticate.command.js'
export * from './application/commands/authenticate.handler.js'

// Application Queries
export { GetUserProfileHandler } from './application/queries/get-user-profile.handler.js'
export type { GetUserProfileQuery } from './application/queries/get-user-profile.query.js'
export { GetUsersHandler } from './application/queries/get-users.handler.js'
export type { GetUsersQuery } from './application/queries/get-users.query.js'
