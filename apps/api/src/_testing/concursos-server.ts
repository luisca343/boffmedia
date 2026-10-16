import { defineConcursosSalas } from '@/_db/schema/Concursos';
import { ConfigModule } from '@nestjs/config';
import {
  CONCURSOS_STORE,
  CONCURSOS_TABLE,
} from '@repositories/concursos.repository';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { ConcursosMemoryStore } from './concursos-memory-store';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConcursosModule } from '@api/boffmedia/concursos/concursos.module';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { ClientsGuard } from '@api/_utils/guards/clients.guard';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
/** Loopback-only QA. Memory by default; durable tests explicitly opt into configured test SQL. */
async function main() {
  const builder = Test.createTestingModule({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' }), ConcursosModule],
  });
  if (process.env.CONCURSOS_QA_DURABLE !== '1')
    builder
      .overrideProvider(DRIZZLE)
      .useValue({})
      .overrideProvider(CONCURSOS_STORE)
      .useValue(new ConcursosMemoryStore());
  if (process.env.CONCURSOS_QA_DURABLE === '1')
    builder
      .overrideProvider(CONCURSOS_TABLE)
      .useValue(defineConcursosSalas('concursos_r12_qa'));
  const module = await builder.compile();
  const app = module.createNestApplication();
  app.useLogger(false);
  app.enableCors({
    origin: ['http://localhost:34339', 'http://127.0.0.1:34339'],
    credentials: false,
  });
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new ClientsGuard(reflector));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  await app.listen(34338, '127.0.0.1');
  console.log('Concursos isolated QA API ready on loopback 34338');
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.name : 'QA startup failed');
  process.exitCode = 1;
});
