import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { MailService } from './mail.service';
import { MailRecipientRepository } from './repositories/mail-recipient.repository';

// DrizzleModule is NOT @Global(): a module whose providers reach the database
// must import it or the DRIZZLE token cannot resolve and the API fails to boot.
// No gate catches that — tsc type-checks the class and check-layering only
// greps for the injection string — so it is stated here rather than assumed.
@Module({
  imports: [DrizzleModule, LoggerModule],
  providers: [MailService, MailRecipientRepository],
  exports: [MailService],
})
export class MailModule {}
