import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { PlayerController } from './player.controller';
import { PlayerFacadeService } from './player.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  getStats: jest.fn(),
  getTeam: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

describe('PlayerController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerFacadeService, useValue: mockFacade },
        ResponseInterceptor,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── POST /smartrotom/player/stats ─────────────────────────────────────────

  describe('POST /smartrotom/player/stats', () => {
    it('returns stats for valid uuid', async () => {
      mockFacade.getStats.mockResolvedValue({ level: 42, kills: 10 });
      const res = await request(app.getHttpServer())
        .post('/smartrotom/player/stats')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getStats).toHaveBeenCalledWith(VALID_UUID);
      expect(res.body.data).toMatchObject({ level: 42 });
    });

    it('rejects missing uuid', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/player/stats')
        .send({})
        .expect(400);
    });

    it('rejects invalid uuid format', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/player/stats')
        .send({ uuid: 'not-a-uuid' })
        .expect(400);
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getStats.mockRejectedValue(new Error('server error'));
      await request(app.getHttpServer())
        .post('/smartrotom/player/stats')
        .send({ uuid: VALID_UUID })
        .expect(500);
    });
  });

  // ── POST /smartrotom/player/team ──────────────────────────────────────────

  describe('POST /smartrotom/player/team', () => {
    it('returns team for valid uuid', async () => {
      mockFacade.getTeam.mockResolvedValue([{ name: 'Pikachu' }]);
      const res = await request(app.getHttpServer())
        .post('/smartrotom/player/team')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getTeam).toHaveBeenCalledWith(VALID_UUID);
      expect(res.body.data).toHaveLength(1);
    });

    it('rejects missing uuid', async () => {
      await request(app.getHttpServer())
        .post('/smartrotom/player/team')
        .send({})
        .expect(400);
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getTeam.mockRejectedValue(new Error('db error'));
      await request(app.getHttpServer())
        .post('/smartrotom/player/team')
        .send({ uuid: VALID_UUID })
        .expect(500);
    });
  });
});
