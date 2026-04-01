import type { ILogger } from '../../application/ports/logger.js'

/**
 * ConsoleLogger — Implementação "boba" focada para dev-mode.
 * Encaminha as mensagens de log para o console padrão do Javascript.
 */
export class ConsoleLogger implements ILogger {
  info(message: string, context?: Record<string, unknown>): void {
    console.log(`[INFO] ${message}`, context ? context : '')
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, error ? error : '', context ? context : '')
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context ? context : '')
  }

  debug(message: string, context?: Record<string, unknown>): void {
    // Para simplificar, debug emitido como .log
    console.log(`[DEBUG] ${message}`, context ? context : '')
  }
}
