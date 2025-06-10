import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { AchievementRepository } from '@repositories/smartrotom/achievement.repository';
import { AchievementService } from './services/achievement.service';
import { ReplayService } from './services/replay.service';
import { BattleAchievementService } from './services/battle-achievement.service';
import { AchievementFacadeService } from './achievement.facade.service';
import { AchievementController } from './achievement.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [AchievementController],
  providers: [
    AchievementRepository,
    
    AchievementService,
    ReplayService,
    BattleAchievementService,
    
    AchievementFacadeService,
  ],
  exports: [
    AchievementFacadeService,
    
    AchievementService,
    ReplayService,
    BattleAchievementService,
  ],
})
export class AchievementModule {}