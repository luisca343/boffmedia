import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { BattleRepository } from '@repositories/smartrotom/battle.repository';
import { ReplayService } from './services/replay.service';
import { ConfigService } from './services/config.service';
import { BattleFacadeService } from './battle.facade.service';
import { BattleController } from './battle.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [BattleController],
  providers: [
    BattleRepository,
    
    ReplayService,
    ConfigService,
    
    BattleFacadeService,
  ],
  exports: [
    BattleFacadeService,
    
    ReplayService,
    ConfigService,
  ],
})
export class BattleModule {}