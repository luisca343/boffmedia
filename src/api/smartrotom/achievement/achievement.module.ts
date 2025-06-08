import { Module } from '@nestjs/common';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [AchievementController],
  providers: [AchievementService],
  exports: [AchievementService]
})
export class AchievementModule {}
