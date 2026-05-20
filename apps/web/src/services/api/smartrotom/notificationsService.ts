import { rotomGET, rotomPATCH, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { NotificationResponseDto, NotificationsInboxDto } from '@boffmedia/shared';

export interface SendNotificationPayload {
  userUuid: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

export class NotificationsService {
  /**
   * Fetch the notification inbox for a user (paginated).
   */
  static getNotifications(
    uuid: string,
    limit = 20,
    offset = 0,
  ): Promise<ApiResponse<NotificationsInboxDto>> {
    return rotomGET<NotificationsInboxDto>(
      `/notifications?uuid=${encodeURIComponent(uuid)}&limit=${limit}&offset=${offset}`,
    );
  }

  /**
   * Mark a single notification as read.
   */
  static markNotificationRead(
    id: number,
    uuid: string,
  ): Promise<ApiResponse<void>> {
    return rotomPATCH<void>(`/notifications/${id}/read`, { uuid });
  }

  /**
   * Mark all notifications as read for a user.
   */
  static markAllNotificationsRead(uuid: string): Promise<ApiResponse<void>> {
    return rotomPATCH<void>('/notifications/read-all', { uuid });
  }

  /**
   * Send a notification to a player (admin use).
   */
  static sendNotification(
    payload: SendNotificationPayload,
  ): Promise<ApiResponse<NotificationResponseDto>> {
    return rotomPOST<NotificationResponseDto>('/notifications/send', payload);
  }
}

export type { NotificationResponseDto, NotificationsInboxDto };
