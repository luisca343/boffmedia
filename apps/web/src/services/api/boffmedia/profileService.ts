import { apiGET } from '@/services/boffAPI'
import type {
  UserActivityItemEntity,
  UserTrophiesEntity,
} from '@boffmedia/shared'

export class ProfileService {
  /** A user's trophy case: full non-hidden catalogue tagged with earned state. */
  static getUserTrophies(userId: number) {
    return apiGET<UserTrophiesEntity>(`/events/users/${userId}/trophies`)
  }

  /** A user's merged activity timeline (achievement unlocks + event joins). */
  static getUserActivity(userId: number, limit?: number) {
    const q = limit ? `?limit=${limit}` : ''
    return apiGET<UserActivityItemEntity[]>(`/events/users/${userId}/activity${q}`)
  }
}
