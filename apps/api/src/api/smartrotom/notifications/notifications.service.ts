import { Injectable, Inject, Optional } from '@nestjs/common';
import { NOTIFICATIONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { INotificationsRepository } from './notifications.repository';
import { RotomNotification } from '@/_db/schema/SmartRotom';
import { SocketsGateway } from '@api/_utils/sockets/sockets.gateway';

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

    @Optional()
    private readonly socketsGateway: SocketsGateway,
  ) {}

  async createNotification(
    input: CreateNotificationInput,
  ): Promise<RotomNotification> {
    const notification = await this.repo.create({
      userUuid: input.userUuid,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    });

    // Emit real-time event to the recipient if they are connected
    if (this.socketsGateway) {
      const userSocket = this.socketsGateway.users.get(input.userUuid);
      if (userSocket) {
        this.socketsGateway.server
          .to(userSocket.socketId)
          .emit('notification:new', notification);
      }
    }

    return notification;
  }

  async getInbox(
    userUuid: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: RotomNotification[]; total: number }> {
    return this.repo.findByUser(userUuid, limit, offset);
  }

  async markRead(id: number, userUuid: string): Promise<void> {
    return this.repo.markRead(id, userUuid);
  }

  async markAllRead(userUuid: string): Promise<void> {
    return this.repo.markAllRead(userUuid);
  }
}
