import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';
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
  getApps: jest.fn(),
  getActiveApps: jest.fn(),
  getInactiveApps: jest.fn(),
  getApp: jest.fn(),
  createApp: jest.fn(),
  updateApp: jest.fn(),
  deleteApp: jest.fn(),
  activateApp: jest.fn(),
  deactivateApp: jest.fn(),
  getAppsForPlayer: jest.fn(),
  addAppToPlayer: jest.fn(),
  removeAppFromPlayer: jest.fn(),
  orderApps: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const mockApp = { id: 1, name: 'ChatApp', url: 'chatapp', active: 1 };

describe('AppsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppsController],
      providers: [
        { provide: AppsFacadeService, useValue: mockFacade },
        { provide: Logger, useValue: mockLogger },
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

  // ── GET /smartrotom/apps ─────────────────────────────────────────────────

  describe('GET /smartrotom/apps', () => {
    it('returns 200 and delegates to facade.getApps', async () => {
      mockFacade.getApps.mockResolvedValue([mockApp]);

      const res = await request(app.getHttpServer()).get('/smartrotom/apps');

      expect(res.status).toBe(200);
      expect(mockFacade.getApps).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/apps/:id ─────────────────────────────────────────────

  describe('GET /smartrotom/apps/:id', () => {
    it('returns 200 and passes numeric id to facade.getApp', async () => {
      mockFacade.getApp.mockResolvedValue(mockApp);

      const res = await request(app.getHttpServer()).get('/smartrotom/apps/1');

      expect(res.status).toBe(200);
      expect(mockFacade.getApp).toHaveBeenCalledWith(1);
    });
  });

  // ── GET /smartrotom/apps/active ─────────────────────────────────────────

  describe('GET /smartrotom/apps/active', () => {
    it('returns 200 and delegates to facade.getActiveApps', async () => {
      mockFacade.getActiveApps.mockResolvedValue([mockApp]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/apps/active',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getActiveApps).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /smartrotom/apps/inactive ────────────────────────────────────────

  describe('GET /smartrotom/apps/inactive', () => {
    it('returns 200 and delegates to facade.getInactiveApps', async () => {
      mockFacade.getInactiveApps.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/apps/inactive',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getInactiveApps).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /smartrotom/apps — CreateAppDto ─────────────────────────────────

  describe('POST /smartrotom/apps — CreateAppDto validation', () => {
    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps')
        .send({ url: 'test-app' });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        path: '/smartrotom/apps',
      });
    });

    it('returns 400 when name exceeds 32 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps')
        .send({ name: 'a'.repeat(33) });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps')
        .send({ name: 'TestApp', hackerField: 'x' });

      expect(res.status).toBe(400);
    });

    it('calls facade.createApp when body is valid', async () => {
      mockFacade.createApp.mockResolvedValue({
        id: 2,
        name: 'TestApp',
        url: 'testapp',
        active: 1,
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps')
        .send({ name: 'TestApp', url: 'testapp' });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.createApp).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'TestApp', url: 'testapp' }),
      );
    });
  });

  // ── PATCH /smartrotom/apps/:id ───────────────────────────────────────────

  describe('PATCH /smartrotom/apps/:id', () => {
    it('returns 200 and calls facade.updateApp with numeric id', async () => {
      mockFacade.updateApp.mockResolvedValue({ ...mockApp, name: 'Updated' });

      const res = await request(app.getHttpServer())
        .patch('/smartrotom/apps/1')
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateApp).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Updated' }),
      );
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/smartrotom/apps/1')
        .send({ hackerField: 'x' });

      expect(res.status).toBe(400);
    });
  });

  // ── DELETE /smartrotom/apps/:id ──────────────────────────────────────────

  describe('DELETE /smartrotom/apps/:id', () => {
    it('returns 200 and calls facade.deleteApp with numeric id', async () => {
      mockFacade.deleteApp.mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const res = await request(app.getHttpServer()).delete(
        '/smartrotom/apps/5',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deleteApp).toHaveBeenCalledWith(5);
    });
  });

  // ── PATCH /smartrotom/apps/:id/activate ──────────────────────────────────

  describe('PATCH /smartrotom/apps/:id/activate', () => {
    it('returns 200 and calls facade.activateApp with numeric id', async () => {
      mockFacade.activateApp.mockResolvedValue({ ...mockApp, active: 1 });

      const res = await request(app.getHttpServer()).patch(
        '/smartrotom/apps/2/activate',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.activateApp).toHaveBeenCalledWith(2);
    });
  });

  // ── PATCH /smartrotom/apps/:id/deactivate ────────────────────────────────

  describe('PATCH /smartrotom/apps/:id/deactivate', () => {
    it('returns 200 and calls facade.deactivateApp with numeric id', async () => {
      mockFacade.deactivateApp.mockResolvedValue({ ...mockApp, active: 0 });

      const res = await request(app.getHttpServer()).patch(
        '/smartrotom/apps/2/deactivate',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deactivateApp).toHaveBeenCalledWith(2);
    });
  });

  // ── POST /smartrotom/apps/player — GetPlayerAppsDto ──────────────────────

  describe('POST /smartrotom/apps/player — GetPlayerAppsDto validation', () => {
    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player')
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player')
        .send({ uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('calls facade.getAppsForPlayer when uuid is valid', async () => {
      mockFacade.getAppsForPlayer.mockResolvedValue([mockApp]);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getAppsForPlayer).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  // ── POST /smartrotom/apps/player/add — PlayerAppDto ──────────────────────

  describe('POST /smartrotom/apps/player/add — PlayerAppDto validation', () => {
    it('returns 400 when id is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/add')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(400);
    });

    it('returns 400 when id is 0 (Min(1) violated)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/add')
        .send({ uuid: VALID_UUID, id: 0 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/add')
        .send({ uuid: 'invalid', id: 1 });

      expect(res.status).toBe(400);
    });

    it('calls facade.addAppToPlayer when body is valid', async () => {
      mockFacade.addAppToPlayer.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/add')
        .send({ uuid: VALID_UUID, id: 1 });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.addAppToPlayer).toHaveBeenCalledWith(VALID_UUID, 1);
    });
  });

  // ── POST /smartrotom/apps/player/remove — PlayerAppDto ───────────────────

  describe('POST /smartrotom/apps/player/remove — PlayerAppDto validation', () => {
    it('returns 400 when body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/remove')
        .send({});

      expect(res.status).toBe(400);
    });

    it('calls facade.removeAppFromPlayer when body is valid', async () => {
      mockFacade.removeAppFromPlayer.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/player/remove')
        .send({ uuid: VALID_UUID, id: 3 });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.removeAppFromPlayer).toHaveBeenCalledWith(
        VALID_UUID,
        3,
      );
    });
  });

  // ── POST /smartrotom/apps/order — OrderAppDto ────────────────────────────

  describe('POST /smartrotom/apps/order — OrderAppDto validation', () => {
    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/order')
        .send({ order: [{ id: 1, order: 1 }] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when order array is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/order')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/order')
        .send({ uuid: 'bad-uuid', order: [{ id: 1, order: 1 }] });

      expect(res.status).toBe(400);
    });

    it('calls facade.orderApps when body is valid', async () => {
      mockFacade.orderApps.mockResolvedValue({ success: true });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps/order')
        .send({
          uuid: VALID_UUID,
          order: [
            { id: 1, order: 1 },
            { id: 2, order: 2 },
          ],
        });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.orderApps).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 1, order: 1 })]),
        VALID_UUID,
      );
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/apps')
        .send({});

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
