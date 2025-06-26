import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { PlayerRepository } from '@api/smartrotom/player/repositories/player.repository';
import { PlayerStatsService } from './services/player.stats.service';
import { PlayerTeamService } from './services/player.team.service';
import { PlayerFacadeService } from './player.facade.service';
import { PlayerController } from './player.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [PlayerController],
  providers: [
    PlayerRepository,
    
    PlayerStatsService,
    PlayerTeamService,
    
    PlayerFacadeService,
  ],
  exports: [
    PlayerFacadeService,
  ],
})
export class PlayerModule {}