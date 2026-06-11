import { Module } from '@nestjs/common';
import { BattleController } from './battle.controller';
import { BattleGateway } from './battle.gateway';
import { MatchmakingService } from './matchmaking.service';
import { AchievementModule } from '@api/smartrotom/achievement/achievement.module';
import { ShowdownGateway } from '../showdown.gateway';

@Module({
  imports: [AchievementModule],
  controllers: [BattleController],
  providers: [BattleGateway, MatchmakingService, ShowdownGateway],
  exports: [MatchmakingService],
})
export class BattleModule {}
