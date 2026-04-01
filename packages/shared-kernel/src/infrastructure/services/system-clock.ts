import type { IClock } from '../../domain/services/clock.js'

/**
 * SystemClock — Implementação padrão de infraestrutura.
 *
 * Utiliza o relógio biológico do sistema operacional corrente para
 * ditar a passagem de tempo no domínio durante a produção.
 */
export class SystemClock implements IClock {
  now(): Date {
    return new Date()
  }
}
