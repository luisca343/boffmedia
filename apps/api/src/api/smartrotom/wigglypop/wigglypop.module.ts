import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { StarbankAccountRepository } from '../starbank/repositories/starbank-account.repository';
import { StarbankTransactionRepository } from '../starbank/repositories/starbank-transaction.repository';
import { WingullModule } from '../wingull/wingull.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { WigglypopListingsRepository } from './repositories/wigglypop-listings.repository';
import { WigglypopOrdersRepository } from './repositories/wigglypop-orders.repository';
import { WigglypopTradingRepository } from './repositories/wigglypop-trading.repository';

import { WigglypopValuationService } from './services/wigglypop-valuation.service';
import { WigglypopEscrowService } from './services/wigglypop-escrow.service';
import { WigglypopCustodyService } from './services/wigglypop-custody.service';
import { WigglypopNotifyService } from './services/wigglypop-notify.service';
import { WigglypopListingsService } from './services/wigglypop-listings.service';
import { WigglypopOrdersService } from './services/wigglypop-orders.service';
import { WigglypopTradingService } from './services/wigglypop-trading.service';
import { WigglypopAuctionService } from './services/wigglypop-auction.service';

import { WigglypopFacadeService } from './wigglypop.facade.service';
import { WigglypopController } from './wigglypop.controller';

@Module({
  imports: [
    DrizzleModule,
    LoggerModule,
    // WingullModule gives the PC reads that prove a seller owns what they list, and the
    // give/take bridge the atomic custody path uses.
    WingullModule,
    NotificationsModule,
    // Drives the auction closer. forRoot() with no args produces the same dynamic-module token
    // as the one in TwitchModule, so Nest dedupes it rather than starting a second scheduler.
    ScheduleModule.forRoot(),
  ],
  controllers: [WigglypopController],
  providers: [
    // Reused directly from StarBank (fresh instances, same DB) so the escrow can settle real
    // transactions without StarbankModule having to export its internal tokens. Same pattern as
    // gobierno's TreasuryService.
    {
      provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
      useClass: StarbankAccountRepository,
    },
    {
      provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
      useClass: StarbankTransactionRepository,
    },

    WigglypopListingsRepository,
    WigglypopOrdersRepository,
    WigglypopTradingRepository,

    WigglypopValuationService,
    WigglypopEscrowService,
    WigglypopCustodyService,
    WigglypopNotifyService,
    WigglypopListingsService,
    WigglypopOrdersService,
    WigglypopTradingService,
    WigglypopAuctionService,

    WigglypopFacadeService,
  ],
  exports: [WigglypopFacadeService],
})
export class WigglypopModule {}
