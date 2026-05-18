import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { FicusAIController } from './ficusai.controller';
import { FicusAIFacadeService } from './ficusai.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockFacade = {
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  initializeChat: jest.fn(),
  deleteUserMessages: jest.fn(),
  getUserMessageCount: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

const SAMPLE_MESSAGE = {
  sender: 'user',
  parts: [{ type: 'text', content: 'Hello' }],
};

describe('FicusAIController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FicusAIController],
      providers: [
        { provide: FicusAIFacadeService, useValue: mockFacade },
        ResponseInterceptor,
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
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

  // ── GET /smartrotom/ficusai/health ────────────────────────────────────────

  describe('GET /smartrotom/ficusai/health', () => {
    it('returns service health info', async () => {
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/health');

      expect(res.status).toBeLessThan(300);
      expect(res.body.data).toMatchObject({
        service: 'FicusAI',
        status: 'healthy',
      });
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  // ── GET /smartrotom/ficusai/messages ──────────────────────────────────────

  describe('GET /smartrotom/ficusai/messages', () => {
    it('returns messages for valid uuid', async () => {
      mockFacade.getMessages.mockResolvedValue([SAMPLE_MESSAGE]);
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getMessages).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
      expect(res.body.data).toHaveLength(1);
    });

    it('accepts optional limit param', async () => {
      mockFacade.getMessages.mockResolvedValue([]);
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID, limit: 5 });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getMessages).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID, limit: 5 }),
      );
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages');

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages')
        .query({ uuid: 'not-a-uuid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when limit is out of range (max 100)', async () => {
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID, limit: 200 });

      expect(res.status).toBe(400);
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getMessages.mockRejectedValue(new Error('db error'));
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBe(500);
    });
  });

  // ── POST /smartrotom/ficusai/send ─────────────────────────────────────────

  describe('POST /smartrotom/ficusai/send', () => {
    const validBody = {
      uuid: VALID_UUID,
      server: 'server-1',
      mensaje: { sender: 'user', parts: [{ type: 'text', content: 'Hello' }] },
    };

    it('returns AI response for valid body', async () => {
      mockFacade.sendMessage.mockResolvedValue(SAMPLE_MESSAGE);
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/send')
        .send(validBody);

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: VALID_UUID }),
      );
      expect(res.body.data).toMatchObject({ sender: 'user' });
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/send')
        .send({ server: 'server-1', mensaje: { sender: 'user', parts: [{ type: 'text', content: 'Hi' }] } });

      expect(res.status).toBe(400);
    });

    it('returns 400 when uuid is not a valid UUID', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/send')
        .send({ ...validBody, uuid: 'bad' });

      expect(res.status).toBe(400);
    });

    it('server field is optional (inherited @IsOptional from BaseDto)', async () => {
      // SendMessageDto extends BaseDto which marks server as @IsOptional,
      // so omitting server is allowed.
      mockFacade.sendMessage.mockResolvedValue(SAMPLE_MESSAGE);
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/send')
        .send({ uuid: VALID_UUID, mensaje: { sender: 'user', parts: [{ type: 'text', content: 'Hi' }] } });

      expect(res.status).toBeLessThan(300);
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.sendMessage.mockRejectedValue(new Error('AI unavailable'));
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/send')
        .send(validBody);

      expect(res.status).toBe(500);
    });
  });

  // ── POST /smartrotom/ficusai/initialize ───────────────────────────────────

  describe('POST /smartrotom/ficusai/initialize', () => {
    it('initializes chat for valid uuid', async () => {
      mockFacade.initializeChat.mockResolvedValue(SAMPLE_MESSAGE);
      const res = await request(app.getHttpServer())
        .post('/smartrotom/ficusai/initialize')
        .send({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.initializeChat).toHaveBeenCalledWith(VALID_UUID);
      expect(res.body.data).toBeDefined();
    });
  });

  // ── DELETE /smartrotom/ficusai/messages ───────────────────────────────────

  describe('DELETE /smartrotom/ficusai/messages', () => {
    it('deletes messages for valid uuid', async () => {
      mockFacade.deleteUserMessages.mockResolvedValue({ success: true });
      const res = await request(app.getHttpServer())
        .delete('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.deleteUserMessages).toHaveBeenCalledWith(VALID_UUID);
      expect(res.body.data).toMatchObject({ success: true });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.deleteUserMessages.mockRejectedValue(new Error('db error'));
      const res = await request(app.getHttpServer())
        .delete('/smartrotom/ficusai/messages')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBe(500);
    });
  });

  // ── GET /smartrotom/ficusai/stats ─────────────────────────────────────────

  describe('GET /smartrotom/ficusai/stats', () => {
    it('returns stats for valid uuid', async () => {
      mockFacade.getUserMessageCount.mockResolvedValue(10);
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/stats')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(mockFacade.getUserMessageCount).toHaveBeenCalledWith(VALID_UUID);
      expect(res.body.data).toMatchObject({
        uuid: VALID_UUID,
        messageCount: 10,
        hasHistory: true,
      });
    });

    it('hasHistory is false when messageCount is 0', async () => {
      mockFacade.getUserMessageCount.mockResolvedValue(0);
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/stats')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBeLessThan(300);
      expect(res.body.data).toMatchObject({ messageCount: 0, hasHistory: false });
    });

    it('returns 500 when facade throws', async () => {
      mockFacade.getUserMessageCount.mockRejectedValue(new Error('db error'));
      const res = await request(app.getHttpServer())
        .get('/smartrotom/ficusai/stats')
        .query({ uuid: VALID_UUID });

      expect(res.status).toBe(500);
    });
  });
});
