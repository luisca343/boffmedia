import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repository
import { MineRepository } from '@api/smartrotom/mine/repositories/mine.repository';

// Import domain services
import { EnergyService } from './services/energy.service';
import { GameService } from './services/game.service';
import { RewardService } from './services/reward.service';
import { PlayerService } from './services/player.service';

// Import facade service
import { MineFacadeService } from './mine.facade.service';

// Import controller
import { MinaController } from './mine.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [MinaController],
  providers: [
    MineRepository,
    
    EnergyService,
    GameService,
    RewardService,
    PlayerService,
    
    MineFacadeService,
  ],
  exports: [
    MineFacadeService,
    
    EnergyService,
    GameService,
    RewardService,
    PlayerService,
  ],
})
export class MineModule {}