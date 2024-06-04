import { Module } from '@nestjs/common';
import { MisionesService } from './misiones.service';
import { MisionesController } from './misiones.controller';

@Module({
  providers: [MisionesService],
  controllers: [MisionesController]
})
export class MisionesModule {}
