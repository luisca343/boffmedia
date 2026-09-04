import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationPreferencesService,
    NotificationPreferencesRepository,
  ],
  exports: [NotificationsService, NotificationPreferencesService],
})
export class NotificationsModule {}
