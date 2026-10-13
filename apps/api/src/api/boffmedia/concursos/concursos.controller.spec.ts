import { Reflector } from '@nestjs/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { ClientsGuard } from '@api/_utils/guards/clients.guard';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ConcursosModule } from './concursos.module';
const capability = (n: number) => 'Bearer ' + n.toString(16).padStart(48, '0');
describe('Concursos anonymous HTTP contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConcursosModule],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new JwtAuthGuard(reflector),
      new ClientsGuard(reflector),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor(reflector));
    await app.init();
  });
  afterAll(async () => app.close());
  it('uses the real global auth guards without a Boffmedia account and keeps secrets out of snapshots', async () => {
    const created = await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(1))
      .send({})
      .expect(201);
    expect(created.headers['cache-control']).toBe('no-store');
    await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(4))
      .send({ account: true })
      .expect(400);
    const code: string = created.body.data.code;
    const joined = await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(2))
      .send({ nickname: '  Lucía  ' })
      .expect(201);
    expect(joined.body.data.members[0].nickname).toBe('Lucía');
    const refreshed = await request(app.getHttpServer())
      .get(`/concursos/rooms/${code}`)
      .set('Authorization', capability(2))
      .expect(200);
    expect(refreshed.body.data.memberId).toBe(joined.body.data.memberId);
    expect(JSON.stringify(refreshed.body)).not.toContain(
      capability(1).slice(7),
    );
    expect(JSON.stringify(refreshed.body)).not.toContain(
      capability(2).slice(7),
    );
    await request(app.getHttpServer())
      .get(`/concursos/rooms/${code}`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/concursos/rooms/${code}`)
      .set('Authorization', capability(3))
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/concursos/rooms/${code}`)
      .set('Authorization', capability(2))
      .expect(403);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: 'Lucía' })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: 'Wrong', host: true })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: '   ' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: 'x'.repeat(25) })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: 'Line\nbreak' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/concursos/rooms/${code}/players`)
      .set('Authorization', capability(3))
      .send({ nickname: 7 })
      .expect(400);
    await request(app.getHttpServer())
      .delete(`/concursos/rooms/${code}`)
      .set('Authorization', capability(1))
      .expect(200);
    const closed = await request(app.getHttpServer())
      .get(`/concursos/rooms/${code}`)
      .set('Authorization', capability(2))
      .expect(200);
    expect(closed.body.data.status).toBe('closed');
  });
});
