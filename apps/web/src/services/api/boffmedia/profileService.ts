import { apiGET } from '@/services/boffAPI'
import type {
  UserActivityItemEntity,
  UserTrophiesEntity,
} from '@boffmedia/shared'

/** Public-safe profile (hand-written; mirrors the NestJS public-profile controller). */
export interface PublicProfile {
  id: number
  name: string
  avatarUrl: string | null
  coverUrl: string | null
  bio: string | null
  roles: string[]
  memberSince: string | null
}

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

  /** Public profile by handle (username) — public-safe identity only. */
  static getByHandle(handle: string) {
    return apiGET<PublicProfile>(`/profile/${encodeURIComponent(handle)}`)
  }
}
