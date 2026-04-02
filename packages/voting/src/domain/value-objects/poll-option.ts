import type { Result } from '@repo/shared-kernel'
import { Result as R, ValidationError } from '@repo/shared-kernel'
import type { Brand } from '@repo/shared-kernel'

/**
 * PollOption — Representa uma opção validada (Ex: 'YES', 'NO', 'ABSTAIN')
 */
export type PollOption = Brand<string, 'PollOption'>

/**
 * Normaliza e transforma uma string em PollOption.
 */
export function createPollOption(raw: string): Result<PollOption, ValidationError> {
  const normalized = raw.trim().toUpperCase()
  if (normalized.length === 0) {
    return R.fail(new ValidationError('Poll option cannot be empty'))
  }
  return R.ok(normalized as PollOption)
}
