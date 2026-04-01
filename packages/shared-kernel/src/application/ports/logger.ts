/**
 * ILogger — Abstração para envio de registros (Logs) do sistema.
 *
 * Utilizado por Casos de Uso (Application) ou Event Handlers para delegar
 * a gravação da operação sem depender estritamente do console ou frameworks.
 */
export interface ILogger {
  /** Log de rastro de fluxo normal. Ex: Usuário registrado, e-mail enviado. */
  info(message: string, context?: Record<string, unknown>): void

  /** Log de exceções do sistema ou falhas de domínio críticas. */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void

  /** Log de alertas ou falhas temporárias solucionáveis. */
  warn(message: string, context?: Record<string, unknown>): void

  /** Log de granularidade fina apenas para ambientes Dev/Test. */
  debug(message: string, context?: Record<string, unknown>): void
}
