import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { OutboxModule } from '@api/outbox/outbox.module';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { StarbankAccountRepository } from '../starbank/repositories/starbank-account.repository';
import { StarbankTransactionRepository } from '../starbank/repositories/starbank-transaction.repository';
import { WingullModule } from '../wingull/wingull.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { StarbankHouseAccountService } from '../starbank/services/starbank-house-account.service';
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
import { WigglypopSagaService } from './services/wigglypop-saga.service';

import { WigglypopFacadeService } from './wigglypop.facade.service';
import { WigglypopController } from './wigglypop.controller';

@Module({
  imports: [
    DrizzleModule,
    LoggerModule,
    // forwardRef on BOTH sides. OutboxModule already forwardRefs this module;
    // leaving this side direct meant that whenever the outbox was reached first
    // (AppModule -> EventsModule -> TournamentsModule -> OutboxModule), this
    // module evaluated while OutboxModule was still initialising and saw
    // `undefined` in its imports array. Nest fails to boot with
    // "The module at index [2] ... is undefined".
    forwardRef(() => OutboxModule),
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

    StarbankHouseAccountService,
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
    WigglypopSagaService,

    WigglypopFacadeService,
  ],
  // The outbox dispatcher resolves these by class. Without the exports its
  // wigglypop handlers inject `undefined` and every delivery throws
  // "not wired into OutboxModule" — which nothing noticed while no producer
  // enqueued those topics.
  exports: [
    WigglypopFacadeService,
    WigglypopSagaService,
    WigglypopCustodyService,
    WigglypopOrdersRepository,
  ],
})
export class WigglypopModule {}
