import type { IQuery } from '@repo/shared-kernel'

export interface GetUserProfileQuery extends IQuery {
  readonly queryName: 'IDENTITY.GET_USER_PROFILE'
  readonly userId: string
}
