import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';
import { StarbankAccountRepository } from './repositories/starbank-account.repository';
import { StarbankTransactionRepository } from './repositories/starbank-transaction.repository';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { StarbankFacadeService } from './starbank.facade.service';
import { StarbankController } from './starbank.controller';
import {
  STARBANK_ACCOUNT_REPOSITORY_TOKEN,
  STARBANK_TRANSACTION_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [StarbankController],
  providers: [
    // Repository providers with dependency injection tokens
    {
      provide: STARBANK_ACCOUNT_REPOSITORY_TOKEN,
      useClass: StarbankAccountRepository,
    },
    {
      provide: STARBANK_TRANSACTION_REPOSITORY_TOKEN,
      useClass: StarbankTransactionRepository,
    },

    // Service providers
    StarbankAccountService,
    StarbankTransactionService,

    // Facade provider
    StarbankFacadeService,
  ],
  exports: [StarbankFacadeService],
})
export class StarbankModule {}
