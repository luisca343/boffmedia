import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
} from '@/services/boffAPI'

export type NotificationType = 'event' | 'achievement' | 'tournament' | 'forum' | 'system'

export interface ApiNotification {
  id: number
  userId: number
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

/** Hand-written (no generate:shared needed). Mirrors the NestJS notifications controller. */
export class NotificationsService {
  static list(limit?: number) {
    const q = limit ? `?limit=${limit}` : ''
    return apiAuthedAutoGET<ApiNotification[]>(`/notifications${q}`)
  }

  static unreadCount() {
    return apiAuthedAutoGET<{ count: number }>('/notifications/unread-count')
  }

  static markRead(id: number) {
    return apiAuthedAutoPATCH<{ success: boolean }>(`/notifications/${id}/read`, {})
  }

  static markAllRead() {
    return apiAuthedAutoPOST<{ success: boolean }>('/notifications/read-all', {})
  }

  static remove(id: number) {
    return apiAuthedAutoDELETE<{ success: boolean }>(`/notifications/${id}`)
  }

  static clear() {
    return apiAuthedAutoDELETE<{ success: boolean }>('/notifications')
  }
}
