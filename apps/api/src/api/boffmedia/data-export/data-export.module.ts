import { forwardRef, Module } from '@nestjs/common';

import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { OutboxModule } from '@api/outbox/outbox.module';

import { DataExportController } from './data-export.controller';
import { DataExportService } from './data-export.service';
import { DataExportRepository } from './repositories/data-export.repository';

/**
 * `forwardRef` in both directions, and it has to be both: this module needs
 * `OutboxRepository` to enqueue the build, and `OutboxModule` needs
 * `DataExportService` to run it. Same shape as the notifications and tournaments
 * handlers already wired into the dispatcher.
 */
@Module({
  imports: [DrizzleModule, LoggerModule, forwardRef(() => OutboxModule)],
  controllers: [DataExportController],
  providers: [DataExportService, DataExportRepository],
  exports: [DataExportService],
})
export class DataExportModule {}
