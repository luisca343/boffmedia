import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

import { AchievementController } from './achievement.controller';
import { AchievementFacadeService } from './achievement.facade.service';

import { AchievementsService } from './services/achievements.service';
import { ReplaysService } from './services/replays.service';
import { BattleAchievementService } from './services/battle-achievement.service';

import { AchievementsRepository } from './repositories/achievements.repository';
import { ReplaysRepository } from './repositories/replays.repository';
import {
  ACHIEVEMENTS_REPOSITORY_TOKEN,
  REPLAYS_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [AchievementController],
  providers: [
    AchievementFacadeService,

    // Services
    AchievementsService,
    ReplaysService,
    BattleAchievementService,

    // Repository Providers
    {
      provide: ACHIEVEMENTS_REPOSITORY_TOKEN,
      useClass: AchievementsRepository,
    },
    {
      provide: REPLAYS_REPOSITORY_TOKEN,
      useClass: ReplaysRepository,
    },
  ],
  exports: [
    AchievementFacadeService,
    AchievementsService,
    ReplaysService,
    BattleAchievementService,
  ],
})
export class AchievementModule {}
