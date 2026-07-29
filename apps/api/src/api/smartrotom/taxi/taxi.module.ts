import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';
import { StarbankAccountRepository } from '../starbank/repositories/starbank-account.repository';
import { StarbankTransactionRepository } from '../starbank/repositories/starbank-transaction.repository';
import { StarbankHouseAccountService } from '../starbank/services/starbank-house-account.service';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';
import { AuditoriaRepository } from '../gobierno/_shared/auditoria.repository';
import { AuditoriaService } from '../gobierno/_shared/auditoria.service';
import { PeopleRepository } from '../gobierno/_shared/people.repository';
import { TaxiController } from './taxi.controller';
import { TaxiService } from './taxi.service';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [TaxiController],
  providers: [
    // Reused directly from StarBank (fresh instances, same DB) so the fare can settle a real
    // transaction without StarbankModule having to export its internal tokens. Same pattern as
    // gobierno's TreasuryService and Wigglypop's escrow.
    {
      provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
      useClass: StarbankAccountRepository,
    },
    {
      provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
      useClass: StarbankTransactionRepository,
    },

    StarbankHouseAccountService,

    // The admin teleport is a moderation action, so it lands in gobierno's append-only
    // auditoría — the same table and shape as every other one, not a taxi-private log.
    AuditoriaRepository,
    PeopleRepository,
    AuditoriaService,

    TaxiService,
  ],
  exports: [TaxiService],
})
export class TaxiModule {}
