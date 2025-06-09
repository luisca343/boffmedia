import { Module } from '@nestjs/common';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { WingullModule } from '../wingull/wingull.module';
import { StarbankRepository } from '@repositories/smartrotom/starbank.repository';
import { StarbankAccountService } from './services/starbank-account.service';
import { StarbankTransactionService } from './services/starbank-transaction.service';
import { StarbankFacadeService } from './starbank.facade.service';
import { StarbankController } from './starbank.controller';

@Module({
  imports: [LoggerModule, ResponseModule, DrizzleModule, WingullModule],
  controllers: [StarbankController],
  providers: [
    StarbankRepository,
    
    StarbankAccountService,
    StarbankTransactionService,
    
    StarbankFacadeService,
  ],
  exports: [
    StarbankFacadeService,
  ],
})
export class StarbankModule {}