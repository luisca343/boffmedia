import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NOTIFICATIONS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [DrizzleModule],
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
