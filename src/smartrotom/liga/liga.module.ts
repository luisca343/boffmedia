import { Module } from '@nestjs/common';
import { LigaController } from './liga.controller';
import { LigaService } from './liga.service';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';
import { DrizzleModule } from '@/drizzle/drizzle.module';

@Module({
  imports: [ResponseModule, LoggerModule, DrizzleModule],
  controllers: [LigaController],
  providers: [LigaService],
})
export class LigaModule {}
