import { UniqueEntityId } from '@repo/shared-kernel'

/**
 * Registo de presença de um parlamentar na sessão (parte do agregado DeliberativeSession).
 */
export class SessionAttendanceEntry {
  private constructor(
    private readonly _parliamentarianId: UniqueEntityId,
    private readonly _recordedAt: Date,
  ) {}

  get parliamentarianId(): UniqueEntityId {
    return this._parliamentarianId
  }

  get recordedAt(): Date {
    return this._recordedAt
  }

  withRecordedAt(recordedAt: Date): SessionAttendanceEntry {
    return new SessionAttendanceEntry(this._parliamentarianId, recordedAt)
  }

  static create(parliamentarianId: UniqueEntityId, recordedAt: Date): SessionAttendanceEntry {
    return new SessionAttendanceEntry(parliamentarianId, recordedAt)
  }

  static reconstitute(props: {
    parliamentarianId: UniqueEntityId
    recordedAt: Date
  }): SessionAttendanceEntry {
    return new SessionAttendanceEntry(props.parliamentarianId, props.recordedAt)
  }
}
