import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import request from 'supertest';

import { CajaController } from './caja.controller';
import { CajaService } from './caja.service';
import { GameServerAuthGuard } from '@api/_utils/guards/game-server-auth.guard';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

describe('CajaController (integration)', () => {
  let app: INestApplication;
  const claim = jest.fn();
  const reserve = jest.fn();
  const confirm = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CajaController],
      providers: [
        { provide: CajaService, useValue: { claim, reserve, confirm } },
        // The global envelope is what makes the @SkipEnvelope() pin meaningful.
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
      ],
    })
      .overrideGuard(GameServerAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => await app.close());
  beforeEach(() => {
    claim.mockReset();
    reserve.mockReset();
    confirm.mockReset();
  });

  const UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

  it('returns objetos and pokemon at the ROOT, not under `data`', async () => {
    // The mod parses both keys off the top level. If the global envelope ever
    // reclaims this route, every claim silently grants nothing.
    claim.mockResolvedValue({
      objetos: [{ id: 'minecraft:diamond', cantidad: 5 }],
      pokemon: [{ spec: 'Incineroar lvl:50', cantidad: 1 }],
    });

    const res = await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'arcade' })
      .expect(200);

    expect(res.body.objetos).toEqual([{ id: 'minecraft:diamond', cantidad: 5 }]);
    expect(res.body.pokemon).toEqual([{ spec: 'Incineroar lvl:50', cantidad: 1 }]);
    expect(res.body.data).toBeUndefined();
    expect(res.body.success).toBeUndefined();
  });

  it('accepts a body with no `server` field', async () => {
    // The mod sends none; the route is on the MinecraftMiddleware exclude list.
    claim.mockResolvedValue({ objetos: [], pokemon: [] });
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'mine' })
      .expect(200);
  });

  it('passes an ids selector through to the service', async () => {
    claim.mockResolvedValue({ objetos: [], pokemon: [] });
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'arcade', ids: [12, 13] })
      .expect(200);
    expect(claim).toHaveBeenCalledWith(UUID, 'arcade', [12, 13]);
  });

  it('returns empty channels rather than an error when nothing is owed', async () => {
    claim.mockResolvedValue({ objetos: [], pokemon: [] });
    const res = await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'arcade' })
      .expect(200);
    expect(res.body.objetos).toEqual([]);
    expect(res.body.pokemon).toEqual([]);
  });

  it('rejects a claim with no source — there is no "everything owed"', async () => {
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID })
      .expect(400);
    expect(claim).not.toHaveBeenCalled();
  });

  it('rejects an unknown source', async () => {
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'everything' })
      .expect(400);
    expect(claim).not.toHaveBeenCalled();
  });

  it('rejects a non-uuid player', async () => {
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: 'not-a-uuid', source: 'mine' })
      .expect(400);
    expect(claim).not.toHaveBeenCalled();
  });

  it('rejects an item list smuggled into the body', async () => {
    // The whole point: the page must never name what it receives.
    await request(app.getHttpServer())
      .post('/smartrotom/caja/claim')
      .send({ uuid: UUID, source: 'mine', objetos: [{ id: 'minecraft:netherite_block', cantidad: 64 }] })
      .expect(400);
    expect(claim).not.toHaveBeenCalled();
  });

  describe('POST /reserve', () => {
    it('returns reservationId + objetos + pokemon at the ROOT, unenveloped', async () => {
      reserve.mockResolvedValue({
        reservationId: 'res-9',
        objetos: [{ id: 'minecraft:diamond', cantidad: 5 }],
        pokemon: [{ spec: 'Incineroar lvl:50', cantidad: 1 }],
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/caja/reserve')
        .send({ uuid: UUID, source: 'arcade', ids: [12, 13] })
        .expect(200);

      expect(res.body.reservationId).toBe('res-9');
      expect(res.body.objetos).toEqual([{ id: 'minecraft:diamond', cantidad: 5 }]);
      expect(res.body.pokemon).toEqual([{ spec: 'Incineroar lvl:50', cantidad: 1 }]);
      expect(res.body.data).toBeUndefined();
      expect(reserve).toHaveBeenCalledWith(UUID, 'arcade', [12, 13]);
    });

    it('rejects a reserve with no source', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/caja/reserve')
        .send({ uuid: UUID })
        .expect(400);
      expect(reserve).not.toHaveBeenCalled();
    });
  });

  describe('POST /confirm', () => {
    it('returns the confirmed count at the ROOT, unenveloped', async () => {
      confirm.mockResolvedValue({ confirmed: 2 });
      const res = await request(app.getHttpServer())
        .post('/smartrotom/caja/confirm')
        .send({ uuid: UUID, reservationId: '9b7c1f2e-3d4a-4b5c-8e9f-0a1b2c3d4e5f' })
        .expect(200);
      expect(res.body.confirmed).toBe(2);
      expect(res.body.data).toBeUndefined();
      expect(confirm).toHaveBeenCalledWith(UUID, '9b7c1f2e-3d4a-4b5c-8e9f-0a1b2c3d4e5f');
    });

    it('rejects a non-uuid reservationId', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/caja/confirm')
        .send({ uuid: UUID, reservationId: 'not-a-uuid' })
        .expect(400);
      expect(confirm).not.toHaveBeenCalled();
    });

    it('rejects a confirm missing the reservationId', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/caja/confirm')
        .send({ uuid: UUID })
        .expect(400);
      expect(confirm).not.toHaveBeenCalled();
    });
  });
});
