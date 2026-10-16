import { concursosSalas } from '@/_db/schema/Concursos';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@api/_utils/drizzle/drizzle.module';
import {
  CONCURSOS_STORE,
  CONCURSOS_TABLE,
  ConcursosRepository,
} from '@repositories/concursos.repository';
import { ConcursosSocketService } from './concursos-socket.service';
import { ConcursosController } from './concursos.controller';
import { ConcursosRoomsService } from './concursos-rooms.service';
import { ConcursosPersistenceService } from './concursos-persistence.service';
@Module({
  imports: [DrizzleModule],
  controllers: [ConcursosController],
  providers: [
    ConcursosRoomsService,
    ConcursosPersistenceService,
    ConcursosSocketService,
    { provide: CONCURSOS_STORE, useClass: ConcursosRepository },
    { provide: CONCURSOS_TABLE, useValue: concursosSalas },
  ],
})
export class ConcursosModule {}
