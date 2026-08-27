import { Module, forwardRef } from '@nestjs/common';
import { OutboxService } from './services/outbox.service';
import { OutboxRepository } from './repositories/outbox.repository';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { NotificationsModule } from '@api/boffmedia/notifications/notifications.module';
import { TournamentsModule } from '@api/boffmedia/tournaments/tournaments.module';
import { WigglypopModule } from '@api/smartrotom/wigglypop/wigglypop.module';
import { MailModule } from '@api/mail/mail.module';

@Module({
  imports: [
    DrizzleModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => TournamentsModule),
    forwardRef(() => WigglypopModule),
    MailModule,
  ],
  providers: [OutboxService, OutboxRepository],
  exports: [OutboxService, OutboxRepository],
})
export class OutboxModule {}
