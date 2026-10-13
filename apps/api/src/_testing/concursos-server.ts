import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConcursosModule } from '@api/boffmedia/concursos/concursos.module';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { ClientsGuard } from '@api/_utils/guards/clients.guard';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
/** Isolated local QA entrypoint; no database, account, Discord or deployed API. */
async function main() {
  const module = await Test.createTestingModule({
    imports: [ConcursosModule],
  }).compile();
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
  console.error(error);
  process.exitCode = 1;
});
