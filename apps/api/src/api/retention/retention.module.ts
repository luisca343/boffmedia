import { Module } from '@nestjs/common';
import { RetentionService } from './retention.service';
import { RetentionRepository } from './repositories/retention.repository';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  providers: [RetentionService, RetentionRepository],
})
export class RetentionModule {}
