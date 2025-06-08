import { Module } from '@nestjs/common';
import { LigaController } from './liga.controller';
import { LigaService } from './liga.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@api/_utils/logger/logger.module';
import { ResponseModule } from '@api/_utils/response/response.module';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';

@Module({
  imports: [ResponseModule, LoggerModule, DrizzleModule],
  controllers: [LigaController],
  providers: [LigaService],
})
export class LigaModule {}
