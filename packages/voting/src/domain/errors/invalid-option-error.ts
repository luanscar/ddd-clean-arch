import { DomainError } from '@repo/shared-kernel'
import type { PollOption } from '../value-objects/poll-option.js'

export class InvalidOptionError extends DomainError {
  readonly code = 'VOTING.INVALID_OPTION'

  constructor(option: string, allowedOptions: PollOption[]) {
    super(`Option '${option}' is not valid for this Poll. Allowed options are: [${allowedOptions.join(', ')}].`)
    this.name = 'InvalidOptionError'
  }
}
