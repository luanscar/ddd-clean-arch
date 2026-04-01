/**
 * DomainError — Classe base abstrata para todos os erros de domínio.
 *
 * Subclasses devem declarar um `code` estático e semântico que identifique
 * o tipo de erro sem ambiguidade (ex: 'USER.VALIDATION_ERROR').
 *
 * Nunca use DomainError diretamente — sempre crie subclasses concretas.
 */
export abstract class DomainError extends Error {
  /**
   * Código identificador do erro. Deve seguir o padrão:
   * CONTEXTO.TIPO_DO_ERRO (ex: 'ORDER.NOT_FOUND')
   */
  abstract readonly code: string

  constructor(
    message: string,
    /** Detalhes estruturados opcionais (ex: campos inválidos, stack causadora). */
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    // Garante que `instanceof` funciona corretamente com herança em TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Serialização para log / tracing estruturado. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}
