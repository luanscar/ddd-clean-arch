import type { PollOption } from './poll-option.js'

/**
 * TallyResult — Mapa imutável após a totalização dos votos.
 * @example
 * {
 *   "SIM": 12,
 *   "NAO": 5,
 *   "ABSTENCAO": 1
 * }
 */
export type TallyResult = Readonly<Record<PollOption, number>>
