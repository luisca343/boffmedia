import { Module, forwardRef } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NOTIFICATIONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SocketsModule } from '@api/_utils/sockets/sockets.module';

@Module({
  imports: [DrizzleModule, forwardRef(() => SocketsModule)],
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFICATIONS_REPOSITORY_TOKEN,
      useClass: NotificationsRepository,
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
