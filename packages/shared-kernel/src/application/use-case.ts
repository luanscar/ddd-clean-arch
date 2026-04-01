import type { Result } from '../helpers/result.js'
import type { DomainError } from '../domain/errors/domain-error.js'

/**
 * IUseCase<Input, Output> — Interface genérica para Casos de Uso.
 *
 * Cada caso de uso encapsula **uma única intenção do usuário** e coordena
 * objetos de domínio sem conter lógica de negócio por si mesmos.
 *
 * Convenções:
 *  - `Input`  deve ser um DTO/Command simples (sem dependências de domínio)
 *  - `Output` deve ser `Result<T, DomainError>` para erros explícitos
 *  - Nunca injete repositórios diretamente numa entidade — faça no use case
 *
 * @example
 *   interface RegisterUserInput {
 *     name: string
 *     email: string
 *   }
 *
 *   class RegisterUserUseCase
 *     implements IUseCase<RegisterUserInput, Result<UserId, DomainError>>
 *   {
 *     async execute(input: RegisterUserInput) {
 *       // orquestra domínio + repositório
 *     }
 *   }
 */
export interface IUseCase<
  Input = void,
  Output = Result<void, DomainError>,
> {
  execute(input: Input): Promise<Output>
}
