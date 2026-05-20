import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATIONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import {
  INotificationsRepository,
} from './notifications.repository';
import { SrNotification } from '@/_db/schema/SmartRotom';

export interface CreateNotificationInput {
  userUuid: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly repo: INotificationsRepository,
  ) {}

  async createNotification(
    input: CreateNotificationInput,
  ): Promise<SrNotification> {
    return this.repo.create({
      userUuid: input.userUuid,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    });
  }

  async getInbox(
    userUuid: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: SrNotification[]; total: number }> {
    return this.repo.findByUser(userUuid, limit, offset);
  }

  async markRead(id: number, userUuid: string): Promise<void> {
    return this.repo.markRead(id, userUuid);
  }

  async markAllRead(userUuid: string): Promise<void> {
    return this.repo.markAllRead(userUuid);
  }
}
