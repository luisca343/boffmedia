import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { MisionesController } from './misiones.controller';
import { MisionesFacadeService } from './misiones.facade.service';
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
  getAllQuests: jest.fn(),
  getQuestsForUser: jest.fn(),
  refreshQuestCache: jest.fn(),
  getCacheStatus: jest.fn(),
  updateNPCs: jest.fn(),
  getAllNPCs: jest.fn(),
  getNPCById: jest.fn(),
  getNPCsByQuestId: jest.fn(),
  uploadNPCImage: jest.fn(),
  checkNPCRenderExists: jest.fn(),
  checkNPCImageExists: jest.fn(),
  validateUserExists: jest.fn(),
  getSystemHealth: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const VALID_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';

describe('MisionesController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MisionesController],
      providers: [
        { provide: MisionesFacadeService, useValue: mockFacade },
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /smartrotom/misiones ─────────────────────────────────────────────

  describe('GET /smartrotom/misiones', () => {
    it('returns 200 and delegates to facade.getAllQuests', async () => {
      mockFacade.getAllQuests.mockResolvedValue({ quests: [] });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllQuests).toHaveBeenCalledTimes(1);
    });

    it('passes force query param to facade', async () => {
      mockFacade.getAllQuests.mockResolvedValue({ quests: [] });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones?force=1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllQuests).toHaveBeenCalledWith(1);
    });
  });

  // ── POST /smartrotom/misiones/user — GetUserQuestsDto ────────────────────

  describe('POST /smartrotom/misiones/user — GetUserQuestsDto validation', () => {
    it('returns 201 and calls facade.getQuestsForUser when uuid is valid', async () => {
      mockFacade.getQuestsForUser.mockResolvedValue({ quests: [] });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/user')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getQuestsForUser).toHaveBeenCalledWith(VALID_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/user')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/user')
        .send({ uuid: 'not-a-uuid' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /smartrotom/misiones/cache/refresh ───────────────────────────────

  describe('POST /smartrotom/misiones/cache/refresh', () => {
    it('returns 201 and delegates to facade.refreshQuestCache', async () => {
      mockFacade.refreshQuestCache.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer()).post(
        '/smartrotom/misiones/cache/refresh',
      );

      expect(res.status).toBe(201);
      expect(mockFacade.refreshQuestCache).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/misiones/cache/status ─────────────────────────────────

  describe('GET /smartrotom/misiones/cache/status', () => {
    it('returns 200 and delegates to facade.getCacheStatus', async () => {
      mockFacade.getCacheStatus.mockResolvedValue({ cached: true });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/cache/status',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCacheStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /smartrotom/misiones/npcs — UpdateNPCsDto ───────────────────────

  describe('POST /smartrotom/misiones/npcs — UpdateNPCsDto validation', () => {
    const VALID_NPCS = { npcs: [{ id: 1, name: 'Professor Oak' }] };

    it('returns 201 and calls facade.updateNPCs when body is valid', async () => {
      mockFacade.updateNPCs.mockResolvedValue({ updated: 1 });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/npcs')
        .send(VALID_NPCS);

      expect(res.status).toBe(201);
      expect(mockFacade.updateNPCs).toHaveBeenCalledWith(
        expect.objectContaining({ npcs: expect.any(Array) }),
      );
    });

    it('returns 400 when npcs array is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/npcs')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/misiones/npcs ────────────────────────────────────────

  describe('GET /smartrotom/misiones/npcs', () => {
    it('returns 200 and delegates to facade.getAllNPCs', async () => {
      mockFacade.getAllNPCs.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/npcs',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllNPCs).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/misiones/npcs/:id ────────────────────────────────────

  describe('GET /smartrotom/misiones/npcs/:id', () => {
    it('returns 200 and delegates to facade.getNPCById with numeric id', async () => {
      mockFacade.getNPCById.mockResolvedValue({ id: 1, name: 'Professor Oak' });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/npcs/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getNPCById).toHaveBeenCalledWith(1);
    });
  });

  // ── GET /smartrotom/misiones/npcs/quest/:questId ─────────────────────────

  describe('GET /smartrotom/misiones/npcs/quest/:questId', () => {
    it('returns 200 and delegates to facade.getNPCsByQuestId', async () => {
      mockFacade.getNPCsByQuestId.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/npcs/quest/5',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getNPCsByQuestId).toHaveBeenCalledWith(5);
    });
  });

  // ── POST /smartrotom/misiones/images/upload — UploadNpcImageDto ───────────

  describe('POST /smartrotom/misiones/images/upload — UploadNpcImageDto validation', () => {
    const VALID_UPLOAD = { npcName: 'professor_oak', image: VALID_IMAGE };

    it('returns 201 and calls facade.uploadNPCImage when body is valid', async () => {
      mockFacade.uploadNPCImage.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/images/upload')
        .send(VALID_UPLOAD);

      expect(res.status).toBe(201);
      expect(mockFacade.uploadNPCImage).toHaveBeenCalledWith(
        expect.objectContaining({ npcName: 'professor_oak' }),
      );
    });

    it('returns 400 when npcName has invalid characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/images/upload')
        .send({ ...VALID_UPLOAD, npcName: 'invalid name!' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when image is not a base64 PNG', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/images/upload')
        .send({ ...VALID_UPLOAD, image: 'not-base64' });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /smartrotom/misiones/images/render/:npcName ──────────────────────

  describe('GET /smartrotom/misiones/images/render/:npcName', () => {
    it('returns 200 and delegates to facade.checkNPCRenderExists', async () => {
      mockFacade.checkNPCRenderExists.mockResolvedValue({ exists: true });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/images/render/professor_oak',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.checkNPCRenderExists).toHaveBeenCalledWith(
        'professor_oak',
      );
    });
  });

  // ── GET /smartrotom/misiones/images/:npcName ─────────────────────────────

  describe('GET /smartrotom/misiones/images/:npcName', () => {
    it('returns 200 and delegates to facade.checkNPCImageExists', async () => {
      mockFacade.checkNPCImageExists.mockResolvedValue({ exists: false });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/images/jessie',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.checkNPCImageExists).toHaveBeenCalledWith('jessie');
    });
  });

  // ── GET /smartrotom/misiones/validate/user/:uuid ──────────────────────────

  describe('GET /smartrotom/misiones/validate/user/:uuid', () => {
    it('returns 200 and returns exists flag', async () => {
      mockFacade.validateUserExists.mockResolvedValue(true);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/misiones/validate/user/${VALID_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.validateUserExists).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── GET /smartrotom/misiones/health ──────────────────────────────────────

  describe('GET /smartrotom/misiones/health', () => {
    it('returns 200 and delegates to facade.getSystemHealth', async () => {
      mockFacade.getSystemHealth.mockResolvedValue({ status: 'healthy' });

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/misiones/health',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSystemHealth).toHaveBeenCalledTimes(1);
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/misiones/user')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
