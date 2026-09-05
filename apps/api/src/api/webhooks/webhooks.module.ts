import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResendWebhookController } from './resend-webhook.controller';
import { ResendWebhookService } from './resend-webhook.service';
import { EmailBounceRepository } from './repositories/email-bounce.repository';

@Module({
  imports: [DrizzleModule, LoggerModule],
  controllers: [ResendWebhookController],
  providers: [ResendWebhookService, EmailBounceRepository],
  exports: [ResendWebhookService],
})
export class WebhooksModule {}
