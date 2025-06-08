import { Module } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { MisionesController } from './misiones.controller';
import { LoggerModule } from '@/logger/logger.module';
import { ResponseModule } from '@/response/response.module';

@Module({
  imports: [LoggerModule, ResponseModule],
  providers: [MisionesService],
  controllers: [MisionesController]
})
export class MisionesModule {}
