import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AuthModule } from '@api/auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ModerationController } from './moderation.controller';
import { ModerationAdminController } from './moderation-admin.controller';
import { ModerationService } from './moderation.service';
import { ModerationRepository } from './repositories/moderation.repository';
import { ContentBanGuard } from './content-ban.guard';

/**
 * `AuthModule` is imported for `StepUpGuard`; `NotificationsModule` for the
 * "we looked at it" message back to the reporter. `AuditRepository` needs no
 * import — `AuditModule` is `@Global()`.
 *
 * `ModerationService` and `ContentBanGuard` are exported so a UGC surface can
 * adopt the sanction with one decorator, without learning what a sanction is.
 */
@Module({
  imports: [DrizzleModule, AuthModule, NotificationsModule],
  controllers: [ModerationController, ModerationAdminController],
  providers: [ModerationService, ModerationRepository, ContentBanGuard],
  exports: [ModerationService, ContentBanGuard],
})
export class ModerationModule {}
