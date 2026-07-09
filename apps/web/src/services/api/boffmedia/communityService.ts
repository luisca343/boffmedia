import { apiGET } from '@/services/boffAPI'

export interface SiteStats {
  users: number
  events: number
  activeEvents: number
  participants: number
  achievements: number
}

export interface ActivityItem {
  type: 'achievement' | 'event_join'
  actor: string
  name: string
  icon: string
  at: string
}

/** Hand-written (no generate:shared needed). Mirrors the NestJS community controller. */
export class CommunityService {
  static getSiteStats() {
    return apiGET<SiteStats>('/stats/site')
  }

  static getActivity(limit?: number) {
    const q = limit ? `?limit=${limit}` : ''
    return apiGET<ActivityItem[]>(`/activity${q}`)
  }
}
