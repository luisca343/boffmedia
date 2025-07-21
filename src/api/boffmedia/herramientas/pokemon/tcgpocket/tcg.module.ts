import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module'; // <-- import this
import { TcgController } from './tcg.controller';
import { TcgService } from './services/tcg.service';
import { TcgFacadeService } from './tcg.facade.service';;
import { TcgRepository } from './repositories/tcg.repository';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

@Module({
  imports: [HttpModule, DrizzleModule],
  controllers: [TcgController],
  providers: [
    TcgService,
    TcgFacadeService,
    {
      provide: TCGPOCKET_REPOSITORY_TOKEN,
      useClass: TcgRepository,
    },
  ],
  exports: [TcgService, TcgFacadeService],
})
export class TcgModule {}