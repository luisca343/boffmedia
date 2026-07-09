import { apiGET } from '@/services/boffAPI'

// Hand-written types mirroring the API's ProfileService shapes
// (`apps/api/.../events/services/profile.service.ts`). These read-only
// profile endpoints are bespoke, so they are typed here rather than in the
// generated `@boffmedia/shared` package.

export interface UserTrophy {
  id: number
  name: string
  description: string | null
  icon: string
  points: number
  rarity: string | null
  itemType: 'achievement' | 'medal'
  category: string
  earned: boolean
  completedAt: string | null
}

export interface UserTrophies {
  earnedCount: number
  totalCount: number
  trophies: UserTrophy[]
}

export interface UserActivityItem {
  type: 'achievement' | 'event_join'
  name: string
  icon: string
  points: number | null
  at: string
}

export class ProfileService {
  /** A user's trophy case: full non-hidden catalogue tagged with earned state. */
  static getUserTrophies(userId: number) {
    return apiGET<UserTrophies>(`/events/users/${userId}/trophies`)
  }

  /** A user's merged activity timeline (achievement unlocks + event joins). */
  static getUserActivity(userId: number, limit?: number) {
    const q = limit ? `?limit=${limit}` : ''
    return apiGET<UserActivityItem[]>(`/events/users/${userId}/activity${q}`)
  }
}
