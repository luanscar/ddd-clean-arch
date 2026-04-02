/**
 * LinkDTO — Representação de um link HATEOAS (Hypermedia as the Engine of Application State).
 * Permite que o cliente descubra ações disponíveis para um recurso.
 */
export interface LinkDTO {
  /**
   * href — URI completa ou relativa do recurso/ação.
   */
  readonly href: string

  /**
   * method — Método HTTP necessário para realizar a ação (GET, POST, etc.).
   */
  readonly method: string

  /**
   * rel — Nome semântico do link (self, update, delete, etc.).
   */
  readonly rel: string
}

/**
 * HATEOASResource — Interface base para DTOs que suportam links hipermedia.
 */
export interface HATEOASResource {
  readonly _links?: Record<string, LinkDTO>
}
