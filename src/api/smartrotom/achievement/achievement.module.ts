import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService]
})
export class AchievementModule {}
