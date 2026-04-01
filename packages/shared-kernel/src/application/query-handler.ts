/**
 * IQuery — Marcador para objetos de consulta (CQRS Query side).
 *
 * Queries são operações de **leitura pura**: não alteram estado,
 * não geram eventos de domínio, e podem retornar DTOs diretamente
 * (sem passar por agregados).
 */
export interface IQuery {
  /** Nome canônico da query para logging e tracing (ex: 'GET_USER_PROFILE'). */
  readonly queryName: string
}

/**
 * IQueryHandler<Q, R> — Interface para handlers de queries (CQRS).
 *
 * @param Q - Tipo da query (deve implementar IQuery)
 * @param R - Tipo do resultado (geralmente um DTO ou lista de DTOs)
 *
 * @example
 *   interface GetUserProfileQuery extends IQuery {
 *     readonly queryName: 'GET_USER_PROFILE'
 *     readonly userId: string
 *   }
 *
 *   class GetUserProfileHandler
 *     implements IQueryHandler<GetUserProfileQuery, UserProfileDTO | null>
 *   {
 *     async handle(query: GetUserProfileQuery): Promise<UserProfileDTO | null> {
 *       return this.readModel.findById(query.userId)
 *     }
 *   }
 */
export interface IQueryHandler<Q extends IQuery, R> {
  handle(query: Q): Promise<R>
}
