import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repository
import { LigaRepository } from '@api/smartrotom/liga/repositories/liga.repository';

// Import domain services
import { ReplayService } from './services/replay.service';
import { StatisticsService } from './services/statistics.service';
import { TournamentService } from './services/tournament.service';

// Import facade service
import { LigaFacadeService } from './liga.facade.service';

// Import controller
import { LigaController } from './liga.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule],
  controllers: [LigaController],
  providers: [
    LigaRepository,
    
    ReplayService,
    StatisticsService,
    TournamentService,
    
    LigaFacadeService,
  ],
  exports: [
    LigaFacadeService,
    
    ReplayService,
    StatisticsService,
    TournamentService,
  ],
})
export class LigaModule {}