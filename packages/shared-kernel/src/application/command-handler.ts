import type { Result } from '../helpers/result.js'
import type { DomainError } from '../domain/errors/domain-error.js'

/**
 * ICommand — Marcador para objetos de comando (CQRS Command side).
 *
 * Commands representam **intenções de mudança de estado**. Eles:
 *  - São nomeados no imperativo: RegisterUser, PlaceOrder, CancelSubscription
 *  - Podem ser rejeitados (por isso retornam Result)
 *  - Produzem efeitos colaterais e podem emitir Domain Events
 *
 * Convenção de `commandName`: SCREAMING_SNAKE_CASE
 *   ✅ 'REGISTER_USER', 'PLACE_ORDER'
 *   ❌ 'registerUser', 'placeOrder'
 */
export interface ICommand {
  readonly commandName: string
}

/**
 * ICommandHandler<C, R> — Interface para handlers de comandos (CQRS).
 *
 * @param C - Tipo do comando (deve implementar ICommand)
 * @param R - Tipo do resultado. Padrão: Result<void, DomainError>
 *
 * @example
 *   interface RegisterUserCommand extends ICommand {
 *     readonly commandName: 'REGISTER_USER'
 *     readonly name: string
 *     readonly email: string
 *   }
 *
 *   class RegisterUserCommandHandler
 *     implements ICommandHandler<RegisterUserCommand, Result<UserId, DomainError>>
 *   {
 *     async handle(command: RegisterUserCommand) {
 *       // orquestra domínio + repositório
 *       // retorna Result — nunca lança exceção
 *     }
 *   }
 */
export interface ICommandHandler<
  C extends ICommand,
  R = Result<void, DomainError>,
> {
  handle(command: C): Promise<R>
}
