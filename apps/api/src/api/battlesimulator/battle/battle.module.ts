import { Module } from '@nestjs/common';
import { BattleService } from './battle.service';
import { BattleController } from './battle.controller';
import { BattleGateway } from './battle.gateway';
import { MatchmakingService } from './matchmaking.service';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';

@Module({
  imports: [AchievementModule],
  controllers: [BattleController],
  providers: [BattleService, BattleGateway, MatchmakingService],
  exports: [BattleService, MatchmakingService],
})
export class BattleModule {}
