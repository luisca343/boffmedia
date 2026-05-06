import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';
import { TrackerRepository } from './tracker.repository';

@Module({
  imports: [DrizzleModule],
  controllers: [TrackerController],
  providers: [TrackerService, TrackerRepository],
  exports: [TrackerService],
})
export class TrackerModule {}
