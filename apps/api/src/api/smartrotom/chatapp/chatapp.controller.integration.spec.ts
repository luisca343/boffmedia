import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { ChatappController } from './chatapp.controller';
import { ChatappFacadeService } from './chatapp.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';
const MOCK_UUID_2 = 'aabbccdd-1234-5678-abcd-ef1234567890';

const mockFacade: jest.Mocked<Partial<ChatappFacadeService>> = {
  createChat: jest.fn(),
  getChats: jest.fn(),
  getChatById: jest.fn(),
  getMessages: jest.fn(),
  createMessage: jest.fn(),
  createGlobalMessage: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  markMessageAsRead: jest.fn(),
  addMemberToGroup: jest.fn(),
  removeMemberFromGroup: jest.fn(),
  initiateCall: jest.fn(),
  endCall: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

describe('ChatappController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatappController],
      providers: [
        { provide: ChatappFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== POST /smartrotom/chatapp/chat ====================


  // ── POST /smartrotom/chatapp/chat ──────────────────────────────────────
  describe('POST /smartrotom/chatapp/chat', () => {
    it('returns 201 and calls facade.createChat', async () => {
      mockFacade.createChat!.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/chat')
        .send({ player: MOCK_UUID, users: [MOCK_UUID_2] });

      expect(res.status).toBe(201);
      expect(mockFacade.createChat).toHaveBeenCalledWith({
        player: MOCK_UUID,
        users: [MOCK_UUID_2],
        name: undefined,
      });
    });

    it('returns 400 when player is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/chat')
        .send({ users: [MOCK_UUID_2] });

      expect(res.status).toBe(400);
    });

    it('returns 400 when users is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/chat')
        .send({ player: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /smartrotom/chatapp/chats/:uuid ====================


  // ── GET /smartrotom/chatapp/chats/:uuid ────────────────────────────────
  describe('GET /smartrotom/chatapp/chats/:uuid', () => {
    it('returns 200 and calls facade.getChats', async () => {
      mockFacade.getChats!.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get(`/smartrotom/chatapp/chats/${MOCK_UUID}`);

      expect(res.status).toBe(200);
      expect(mockFacade.getChats).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/chatapp/chat/:chatId ====================


  // ── GET /smartrotom/chatapp/chat/:chatId ───────────────────────────────
  describe('GET /smartrotom/chatapp/chat/:chatId', () => {
    it('returns 200 and calls facade.getChatById', async () => {
      mockFacade.getChatById!.mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer())
        .get('/smartrotom/chatapp/chat/1')
        .query({ uuid: MOCK_UUID });

      expect(res.status).toBe(200);
      expect(mockFacade.getChatById).toHaveBeenCalledWith(1, MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/chatapp/messages/:chatId ====================


  // ── GET /smartrotom/chatapp/messages/:chatId ───────────────────────────
  describe('GET /smartrotom/chatapp/messages/:chatId', () => {
    it('returns 200 and calls facade.getMessages', async () => {
      mockFacade.getMessages!.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/smartrotom/chatapp/messages/5');

      expect(res.status).toBe(200);
      expect(mockFacade.getMessages).toHaveBeenCalledWith(5);
    });
  });

  // ==================== POST /smartrotom/chatapp/messages/:chatId ====================


  // ── POST /smartrotom/chatapp/messages/:chatId ──────────────────────────
  describe('POST /smartrotom/chatapp/messages/:chatId', () => {
    it('returns 201 and calls facade.createMessage', async () => {
      mockFacade.createMessage!.mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/messages/5')
        .send({ uuid: MOCK_UUID, message: 'Hello!' });

      expect(res.status).toBe(201);
      expect(mockFacade.createMessage).toHaveBeenCalledWith(5, {
        uuid: MOCK_UUID,
        message: 'Hello!',
        type: undefined,
      });
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/messages/5')
        .send({ message: 'Hello!' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when message is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/messages/5')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/chatapp/global-message ====================


  // ── POST /smartrotom/chatapp/global-message ────────────────────────────
  describe('POST /smartrotom/chatapp/global-message', () => {
    it('returns 201 and calls facade.createGlobalMessage', async () => {
      mockFacade.createGlobalMessage!.mockResolvedValue({ id: 2 } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/global-message')
        .send({ uuid: MOCK_UUID, message: 'Global hello!' });

      expect(res.status).toBe(201);
      expect(mockFacade.createGlobalMessage).toHaveBeenCalledWith({
        uuid: MOCK_UUID,
        message: 'Global hello!',
        type: undefined,
      });
    });
  });

  // ==================== PUT /smartrotom/chatapp/message/:messageId ====================


  // ── PUT /smartrotom/chatapp/message/:messageId ─────────────────────────
  describe('PUT /smartrotom/chatapp/message/:messageId', () => {
    it('returns 200 and calls facade.updateMessage', async () => {
      mockFacade.updateMessage!.mockResolvedValue({ id: 10 } as any);

      const res = await request(app.getHttpServer())
        .put('/smartrotom/chatapp/message/10')
        .send({ messageId: 10, content: 'Updated', uuid: MOCK_UUID });

      expect(res.status).toBe(200);
      expect(mockFacade.updateMessage).toHaveBeenCalledWith(10, 'Updated', MOCK_UUID);
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(app.getHttpServer())
        .put('/smartrotom/chatapp/message/10')
        .send({ messageId: 10, uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== DELETE /smartrotom/chatapp/message/:messageId ====================


  // ── DELETE /smartrotom/chatapp/message/:messageId ──────────────────────
  describe('DELETE /smartrotom/chatapp/message/:messageId', () => {
    it('returns 200 and calls facade.deleteMessage', async () => {
      mockFacade.deleteMessage!.mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .delete('/smartrotom/chatapp/message/10')
        .send({ messageId: 10, uuid: MOCK_UUID });

      expect(res.status).toBe(200);
      expect(mockFacade.deleteMessage).toHaveBeenCalledWith(10, MOCK_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .delete('/smartrotom/chatapp/message/10')
        .send({ messageId: 10 });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/chatapp/message/:messageId/read ====================


  // ── POST /smartrotom/chatapp/message/:messageId/read ───────────────────
  describe('POST /smartrotom/chatapp/message/:messageId/read', () => {
    it('returns 201 and calls facade.markMessageAsRead', async () => {
      mockFacade.markMessageAsRead!.mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/message/10/read')
        .send({ messageId: 10, uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.markMessageAsRead).toHaveBeenCalledWith(10, MOCK_UUID);
    });
  });

  // ==================== POST /smartrotom/chatapp/group/:groupId/member ====================


  // ── POST /smartrotom/chatapp/group/:groupId/member ─────────────────────
  describe('POST /smartrotom/chatapp/group/:groupId/member', () => {
    it('returns 201 and calls facade.addMemberToGroup', async () => {
      mockFacade.addMemberToGroup!.mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/group/3/member')
        .send({ groupId: 3, uuid: MOCK_UUID_2, requestingUserUuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.addMemberToGroup).toHaveBeenCalledWith(3, MOCK_UUID_2, MOCK_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/group/3/member')
        .send({ groupId: 3, requestingUserUuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== DELETE /smartrotom/chatapp/group/:groupId/member/:uuid ====================


  // ── DELETE /smartrotom/chatapp/group/:groupId/member/:uuid ─────────────
  describe('DELETE /smartrotom/chatapp/group/:groupId/member/:uuid', () => {
    it('returns 200 and calls facade.removeMemberFromGroup', async () => {
      mockFacade.removeMemberFromGroup!.mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .delete(`/smartrotom/chatapp/group/3/member/${MOCK_UUID_2}`)
        .send({ groupId: 3, uuid: MOCK_UUID_2, requestingUserUuid: MOCK_UUID });

      expect(res.status).toBe(200);
      expect(mockFacade.removeMemberFromGroup).toHaveBeenCalledWith(3, MOCK_UUID_2, MOCK_UUID);
    });
  });

  // ==================== POST /smartrotom/chatapp/call/:chatId ====================


  // ── POST /smartrotom/chatapp/call/:chatId ──────────────────────────────
  describe('POST /smartrotom/chatapp/call/:chatId', () => {
    it('returns 201 and calls facade.initiateCall', async () => {
      mockFacade.initiateCall!.mockResolvedValue({ callId: 'abc' } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/call/5')
        .send({ chatId: 5, uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.initiateCall).toHaveBeenCalledWith(5, MOCK_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/call/5')
        .send({ chatId: 5 });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/chatapp/call/:chatId/end ====================


  // ── POST /smartrotom/chatapp/call/:chatId/end ──────────────────────────
  describe('POST /smartrotom/chatapp/call/:chatId/end', () => {
    it('returns 201 and calls facade.endCall', async () => {
      mockFacade.endCall!.mockResolvedValue({ id: 3 } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/call/5/end')
        .send({ chatId: 5, startTime: 1640995200000 });

      expect(res.status).toBe(201);
      expect(mockFacade.endCall).toHaveBeenCalledWith(5, 1640995200000);
    });

    it('returns 400 when startTime is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/chatapp/call/5/end')
        .send({ chatId: 5 });

      expect(res.status).toBe(400);
    });
  });
});
