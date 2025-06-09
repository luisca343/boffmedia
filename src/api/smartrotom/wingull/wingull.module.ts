import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

// Import repository
import { WingullRepository } from '@repositories/smartrotom/wingull.repository';

// Import domain services
import { WingullEconomyService } from './services/wingull-economy.service';
import { WingullPlayerService } from './services/wingull-player.service';
import { WingullWorldService } from './services/wingull-world.service';
import { WingullTransportService } from './services/wingull-transport.service';

// Import facade service
import { WingullFacadeService } from './wingull.facade.service';

// Import controller
import { WingullController } from './wingull.controller';

@Module({
  imports: [LoggerModule, ResponseModule],
  controllers: [WingullController],
  providers: [
    WingullRepository,
    
    WingullEconomyService,
    WingullPlayerService,
    WingullWorldService,
    WingullTransportService,
    
    WingullFacadeService,
  ],
  exports: [
    WingullFacadeService,
  ],
})
export class WingullModule {}