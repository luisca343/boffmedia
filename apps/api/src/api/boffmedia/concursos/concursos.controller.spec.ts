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
  it('validates anonymous device requests without exposing a room or requiring an account', async () => {
    const client = request(app.getHttpServer());
    const created = await client
      .post('/concursos/rooms')
      .set('Authorization', capability(80))
      .send({})
      .expect(201);
    const base = '/concursos/rooms/' + created.body.data.code;
    await client
      .post(base + '/players')
      .set('Authorization', capability(81))
      .send({ nickname: 'Device A' })
      .expect(201);
    await client
      .post(base + '/recovery-requests')
      .set('Authorization', capability(82))
      .send({ nickname: 'Device A', host: true })
      .expect(400);
    const pending = await client
      .post(base + '/recovery-requests')
      .set('Authorization', capability(82))
      .send({ nickname: ' Device A ' })
      .expect(201);
    expect(pending.headers['cache-control']).toBe('no-store');
    expect(pending.body.data).toMatchObject({
      nickname: 'Device A',
      status: 'pending',
    });
    expect(pending.body.data.members).toBeUndefined();
    expect(pending.body.data.game).toBeUndefined();
    await client.get(base).set('Authorization', capability(82)).expect(403);
    await client
      .post(base + '/recovery-requests')
      .send({ nickname: 'Device A' })
      .expect(401);
  });
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
  it('validates gameplay DTOs and exposes only actor-scoped state through the real guards', async () => {
    const client = request(app.getHttpServer());
    const created = await client
      .post('/concursos/rooms')
      .set('Authorization', capability(20))
      .send({});
    const base = '/concursos/rooms/' + created.body.data.code;
    await client
      .post(base + '/players')
      .set('Authorization', capability(21))
      .send({ nickname: 'Individual A' })
      .expect(201);
    await client
      .post(base + '/players')
      .set('Authorization', capability(22))
      .send({ nickname: 'Individual B' })
      .expect(201);
    await client
      .post(base + '/configuration')
      .set('Authorization', capability(21))
      .send({ mode: 'teams', pacing: 'directed' })
      .expect(403);
    await client
      .post(base + '/configuration')
      .set('Authorization', capability(20))
      .send({ mode: 'mixed' })
      .expect(400);
    await client
      .post(base + '/game')
      .set('Authorization', capability(20))
      .send({ questions: [] })
      .expect(400);
    const question = {
      id: 'http-1',
      category: 'Ciencia',
      prompt: 'Planet?',
      choices: ['Venus', 'Mars', 'Earth', 'Jupiter'],
      correctIndex: 1,
      seconds: 20,
      points: 100,
      phaseIndex: 0,
      phaseTitle: 'HTTP phase',
    };
    await client
      .post(base + '/game')
      .set('Authorization', capability(20))
      .send({ questions: [{ ...question, correctIndex: 4 }] })
      .expect(400);
    await client
      .post(base + '/game')
      .set('Authorization', capability(20))
      .send({ questions: [question] })
      .expect(201);
    const open = await client
      .post(base + '/game/actions')
      .set('Authorization', capability(21))
      .send({ action: 'choose', questionId: 'http-1' })
      .expect(201);
    expect(open.body.data.game.question).not.toHaveProperty('correctIndex');
    await client
      .post(base + '/game/actions')
      .set('Authorization', capability(21))
      .send({ action: 'answer', roundId: 1, choice: 99 })
      .expect(400);
    await client
      .post(base + '/game/actions')
      .set('Authorization', capability(21))
      .send({ action: 'answer', roundId: 1, choice: 1 })
      .expect(201);
    const rival = await client
      .get(base)
      .set('Authorization', capability(22))
      .expect(200);
    expect(rival.body.data.game.own).not.toHaveProperty('answer');
    expect(rival.body.data.game.question).not.toHaveProperty('correctIndex');
    const result = await client
      .post(base + '/game/actions')
      .set('Authorization', capability(22))
      .send({ action: 'answer', roundId: 1, choice: 0 })
      .expect(201);
    expect(result.body.data.game.stage).toBe('result');
    expect(
      result.body.data.entities.map((e: { score: number }) => e.score),
    ).toEqual([100, 0]);
    await client.delete(base).set('Authorization', capability(20)).expect(200);
  });
  it('validates versioned nested recovery configuration on anonymous room creation', async () => {
    await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(40))
      .send({ recoverySettings: { hostGraceSeconds: '5' } })
      .expect(400);
    await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(41))
      .send({ recoverySettings: { version: 2 } })
      .expect(400);
    await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(42))
      .send({ recoverySettings: { extra: true } })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post('/concursos/rooms')
      .set('Authorization', capability(43))
      .send({
        recoverySettings: { hostGraceSeconds: 0, resumeCountdownSeconds: 0 },
      })
      .expect(201);
    expect(created.body.data.recoverySettings).toMatchObject({
      version: 1,
      hostGraceSeconds: 0,
      resumeCountdownSeconds: 0,
      hostRetentionMinutes: 10,
      hideQuestionWhilePaused: true,
      allowLocalSelectionWhilePaused: false,
    });
  });
});
