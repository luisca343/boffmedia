import { Module } from '@nestjs/common';
import { ConcursosController } from './concursos.controller';
import { ConcursosRoomsService } from './concursos-rooms.service';
@Module({
  controllers: [ConcursosController],
  providers: [ConcursosRoomsService],
})
export class ConcursosModule {}
