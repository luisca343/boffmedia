import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { ResponseService } from '@api/_utils/response/response.service';

// Import repository and interfaces
import { MineRepository } from './repositories/mine.repository';

// Import domain services
import { EnergyService } from './services/energy.service';
import { GameService } from './services/game.service';
import { RewardService } from './services/reward.service';
import { PlayerService } from './services/player.service';

// Import facade service
import { MineFacadeService } from './mine.facade.service';

import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { MineController } from './mine.controller';

@Module({
  imports: [LoggerModule, DrizzleModule],
  controllers: [MineController],
  providers: [
    MineFacadeService,
    EnergyService,
    GameService,
    RewardService,
    PlayerService,
    ResponseService,
    {
      provide: MINE_REPOSITORY_TOKEN,
      useClass: MineRepository,
    },
  ],
  exports: [
    MineFacadeService,
    EnergyService,
    GameService,
    RewardService,
    PlayerService,
  ],
})
export class SmartRotomMineModule {}