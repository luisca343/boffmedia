import { Module } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { RetentionRepository } from './repositories/retention.repository';
import { UserErasureService } from './user-erasure.service';
import { UserErasureRepository } from './repositories/user-erasure.repository';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DataExportModule } from '@api/boffmedia/data-export/data-export.module';

@Module({
  // `DataExportModule` for two jobs the sweep owns: purging expired archives,
  // and removing an erased account's archives before its row goes. `AuditService`
  // needs no import — `AuditModule` is @Global.
  imports: [DrizzleModule, LoggerModule, DataExportModule],
  providers: [
    RetentionService,
    RetentionRepository,
    UserErasureService,
    UserErasureRepository,
  ],
})
export class RetentionModule {}
