import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseService } from '@api/_utils/response/response.service';
import { TcgController } from './tcg.controller';
import { TcgService } from './services/tcg.service';
import { TcgFetchService } from './services/tcg-fetch.service';
import { TcgImageService } from './services/tcg-image.service';
import { TcgErrorService } from './services/tcg-error.service';
import { TcgConfigService } from './services/tcg-config.service';
import { TcgFacadeService } from './tcg.facade.service';
import { TcgRepository } from './repositories/tcg.repository';
import { TCGPOCKET_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { BoffMediaUsersModule } from '@api/boffmedia/users/users.module';

@Module({
  imports: [HttpModule, DrizzleModule, LoggerModule, BoffMediaUsersModule],
  controllers: [TcgController],
  providers: [
    TcgService,
    TcgFetchService,
    TcgImageService,
    TcgFacadeService,
    TcgErrorService,
    TcgConfigService,
    ResponseService,
    {
      provide: TCGPOCKET_REPOSITORY_TOKEN,
      useClass: TcgRepository,
    },
  ],
  exports: [TcgService, TcgFacadeService],
})
export class TcgModule {}
