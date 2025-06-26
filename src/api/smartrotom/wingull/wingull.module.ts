import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import domain services
import { WingullEconomyService } from './services/wingull-economy.service';
import { WingullPlayerService } from './services/wingull-player.service';
import { WingullWorldService } from './services/wingull-world.service';
import { WingullTransportService } from './services/wingull-transport.service';

// Import facade service
import { WingullFacadeService } from './wingull.facade.service';

// Import controller
import { WingullController } from './wingull.controller';
import { WINGULL_ECONOMY_REPOSITORY_TOKEN, WINGULL_TRANSPORT_REPOSITORY_TOKEN, WINGULL_USER_REPOSITORY_TOKEN, WINGULL_WORLD_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { WingullEconomyRepository } from './repositories/wingull-economy.repository';
import { WingullTransportRepository } from './repositories/wingull-transport.repository';
import { WingullPlayerRepository } from './repositories/wingull-player.repository';
import { WingullWorldRepository } from './repositories/wingull-world.repository';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [WingullController],
  providers: [
    WingullEconomyService,
    WingullPlayerService,
    WingullWorldService,
    WingullTransportService,
    
    WingullFacadeService,

    {
      provide: WINGULL_ECONOMY_REPOSITORY_TOKEN,
      useClass: WingullEconomyRepository,
    }, 
    {
      provide: WINGULL_TRANSPORT_REPOSITORY_TOKEN,
      useClass: WingullTransportRepository
    },
    {
      provide: WINGULL_USER_REPOSITORY_TOKEN,
      useClass: WingullPlayerRepository
    },
    {
      provide: WINGULL_WORLD_REPOSITORY_TOKEN,
      useClass: WingullWorldRepository
    }
  ],
  exports: [
    WingullFacadeService,

    WingullEconomyService,
    WingullPlayerService,
    WingullWorldService,
    WingullTransportService,

    WINGULL_ECONOMY_REPOSITORY_TOKEN,
    WINGULL_TRANSPORT_REPOSITORY_TOKEN,
    WINGULL_USER_REPOSITORY_TOKEN,
    WINGULL_WORLD_REPOSITORY_TOKEN,
  ],
})
export class WingullModule {}