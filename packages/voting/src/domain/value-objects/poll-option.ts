import type { Brand } from '@repo/shared-kernel'

/**
 * PollOption — Representa uma opção validada (Ex: 'YES', 'NO', 'ABSTAIN')
 */
export type PollOption = Brand<string, 'PollOption'>

/**
 * Normaliza e transforma uma string em PollOption.
 */
export function createPollOption(raw: string): PollOption {
  return raw.trim().toUpperCase() as PollOption
}
