import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { DocumentsController } from './documents.controller';
import { DocumentsFacadeService } from './documents.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

// Allow all guard — used to bypass JWT+Roles on admin endpoints
class AllowAllGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext) {
    return true;
  }
}

const mockFacade: jest.Mocked<Partial<DocumentsFacadeService>> = {
  getDocumentById: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getUserNotes: jest.fn(),
  createNoteWithUser: jest.fn(),
  saveDocument: jest.fn(),
  addNoteToUser: jest.fn(),
  removeNoteFromUser: jest.fn(),
  getAllNews: jest.fn(),
  getPublishedNews: jest.fn(),
  getFeaturedNews: jest.fn(),
  getNewsById: jest.fn(),
  createNews: jest.fn(),
  updateNews: jest.fn(),
  deleteNews: jest.fn(),
  updateNewsStatus: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('DocumentsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(AllowAllGuard)
      .overrideGuard(RolesGuard)
      .useClass(AllowAllGuard)
      .compile();

    app = module.createNestApplication();
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

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== GET /smartrotom/documents/document/:id ====================

  // ── GET /smartrotom/documents/document/:id ─────────────────────────────
  describe('GET /smartrotom/documents/document/:id', () => {
    it('returns 200 and delegates to facade.getDocumentById', async () => {
      (mockFacade.getDocumentById! as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Test',
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/document/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getDocumentById).toHaveBeenCalledWith(1);
    });

    it('returns 500 when id is non-numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/document/abc',
      );

      expect(res.status).toBe(500);
    });
  });

  // ==================== POST /smartrotom/documents/document ====================

  // ── POST /smartrotom/documents/document ────────────────────────────────
  describe('POST /smartrotom/documents/document', () => {
    it('returns 201 and delegates to facade.createDocument', async () => {
      (mockFacade.createDocument! as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Doc',
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/document')
        .send({ title: 'My Doc', content: 'Hello world', type: 1 });

      expect(res.status).toBe(201);
      expect(mockFacade.createDocument).toHaveBeenCalledWith({
        title: 'My Doc',
        content: 'Hello world',
        type: 1,
      });
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/document')
        .send({ content: 'Hello', type: 1 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when type is negative (Min 0 fails on negative)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/document')
        .send({ title: 'Doc', content: 'Hello', type: -1 });

      expect(res.status).toBe(400);
    });
  });

  // ==================== PUT /smartrotom/documents/document/:id ====================

  // ── PUT /smartrotom/documents/document/:id ─────────────────────────────
  describe('PUT /smartrotom/documents/document/:id', () => {
    it('returns 200 and delegates to facade.updateDocument', async () => {
      (mockFacade.updateDocument! as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Updated',
      } as any);

      const res = await request(app.getHttpServer())
        .put('/smartrotom/documents/document/1')
        .send({ title: 'Updated' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateDocument).toHaveBeenCalledWith(1, {
        title: 'Updated',
      });
    });

    it('returns 500 when id is non-numeric', async () => {
      const res = await request(app.getHttpServer())
        .put('/smartrotom/documents/document/abc')
        .send({ title: 'Updated' });

      expect(res.status).toBe(500);
    });
  });

  // ==================== DELETE /smartrotom/documents/document/:id ====================

  // ── DELETE /smartrotom/documents/document/:id ──────────────────────────
  describe('DELETE /smartrotom/documents/document/:id', () => {
    it('returns 200 and delegates to facade.deleteDocument', async () => {
      (mockFacade.deleteDocument! as jest.Mock).mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer()).delete(
        '/smartrotom/documents/document/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deleteDocument).toHaveBeenCalledWith(1);
    });
  });

  // ==================== POST /smartrotom/documents/notes ====================

  // ── POST /smartrotom/documents/notes ───────────────────────────────────
  describe('POST /smartrotom/documents/notes', () => {
    it('returns 201 and delegates to facade.getUserNotes', async () => {
      (mockFacade.getUserNotes! as jest.Mock).mockResolvedValue([] as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/notes')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.getUserNotes).toHaveBeenCalledWith(MOCK_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/notes')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /smartrotom/documents/all/:uuid ====================

  // ── GET /smartrotom/documents/all/:uuid ────────────────────────────────
  describe('GET /smartrotom/documents/all/:uuid', () => {
    it('returns 200 and delegates to facade.getUserNotes (legacy)', async () => {
      (mockFacade.getUserNotes! as jest.Mock).mockResolvedValue([] as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/documents/all/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserNotes).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== POST /smartrotom/documents/create ====================

  // ── POST /smartrotom/documents/create ──────────────────────────────────
  describe('POST /smartrotom/documents/create', () => {
    it('returns 201 and delegates to facade.createNoteWithUser', async () => {
      (mockFacade.createNoteWithUser! as jest.Mock).mockResolvedValue({
        noteId: 1,
        relationId: 2,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/create')
        .send({ title: 'Note', content: 'Body', type: 0, uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.createNoteWithUser).toHaveBeenCalledWith({
        title: 'Note',
        content: 'Body',
        type: 0,
        uuid: MOCK_UUID,
      });
    });
  });

  // ==================== POST /smartrotom/documents/save/:id ====================

  // ── POST /smartrotom/documents/save/:id ────────────────────────────────
  describe('POST /smartrotom/documents/save/:id', () => {
    it('returns 201 and delegates to facade.saveDocument', async () => {
      (mockFacade.saveDocument! as jest.Mock).mockResolvedValue({
        id: 1,
        created: false,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/save/1')
        .send({ title: 'My Note', content: 'Updated content', type: 1 });

      expect(res.status).toBe(201);
      expect(mockFacade.saveDocument).toHaveBeenCalledWith(
        1,
        'My Note',
        'Updated content',
        1,
      );
    });

    it('returns 500 when id is non-numeric', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/save/abc')
        .send({ title: 'x', content: 'y', type: 0 });

      expect(res.status).toBe(500);
    });
  });

  // ==================== POST /smartrotom/documents/note/user ====================

  // ── POST /smartrotom/documents/note/user ───────────────────────────────
  describe('POST /smartrotom/documents/note/user', () => {
    it('returns 201 and delegates to facade.addNoteToUser', async () => {
      (mockFacade.addNoteToUser! as jest.Mock).mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/note/user')
        .send({ documentId: 1, uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.addNoteToUser).toHaveBeenCalledWith(1, MOCK_UUID);
    });

    it('returns 400 when documentId is below Min(1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/note/user')
        .send({ documentId: 0, uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== DELETE /smartrotom/documents/note/user ====================

  // ── DELETE /smartrotom/documents/note/user ─────────────────────────────
  describe('DELETE /smartrotom/documents/note/user', () => {
    it('returns 200 and delegates to facade.removeNoteFromUser', async () => {
      (mockFacade.removeNoteFromUser! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer())
        .delete('/smartrotom/documents/note/user')
        .send({ documentId: 1, uuid: MOCK_UUID });

      expect(res.status).toBe(200);
      expect(mockFacade.removeNoteFromUser).toHaveBeenCalledWith(1, MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/documents/news ====================

  // ── GET /smartrotom/documents/news ─────────────────────────────────────
  describe('GET /smartrotom/documents/news', () => {
    it('returns 200 and fetches all news by default', async () => {
      (mockFacade.getAllNews! as jest.Mock).mockResolvedValue({ total: 0, news: [] } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/news',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllNews).toHaveBeenCalled();
    });

    it('returns 200 and fetches published news when published=true', async () => {
      (mockFacade.getPublishedNews! as jest.Mock).mockResolvedValue({
        total: 0,
        news: [],
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/news?published=true',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getPublishedNews).toHaveBeenCalled();
    });
  });

  // ==================== GET /smartrotom/documents/news/featured ====================

  // ── GET /smartrotom/documents/news/featured ────────────────────────────
  describe('GET /smartrotom/documents/news/featured', () => {
    it('returns 200 and delegates to facade.getFeaturedNews', async () => {
      (mockFacade.getFeaturedNews! as jest.Mock).mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/news/featured',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getFeaturedNews).toHaveBeenCalled();
    });
  });

  // ==================== GET /smartrotom/documents/news/:newsId ====================

  // ── GET /smartrotom/documents/news/:newsId ─────────────────────────────
  describe('GET /smartrotom/documents/news/:newsId', () => {
    it('returns 200 and delegates to facade.getNewsById', async () => {
      (mockFacade.getNewsById! as jest.Mock).mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/news/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getNewsById).toHaveBeenCalledWith(1);
    });

    it('returns 500 when newsId is non-numeric', async () => {
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/documents/news/abc',
      );

      expect(res.status).toBe(500);
    });
  });

  // ==================== POST /smartrotom/documents/news (admin) ====================

  // ── POST /smartrotom/documents/news ────────────────────────────────────
  describe('POST /smartrotom/documents/news', () => {
    it('returns 201 and delegates to facade.createNews', async () => {
      (mockFacade.createNews! as jest.Mock).mockResolvedValue({ id: 1 } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/news')
        .send({ id: 1, title: 'Big News', content: 'Something happened' });

      expect(res.status).toBe(201);
      expect(mockFacade.createNews).toHaveBeenCalled();
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/news')
        .send({ id: 1, content: 'Something happened' });

      expect(res.status).toBe(400);
    });
  });

  // ==================== PUT /smartrotom/documents/news/:newsId (admin) ====================

  // ── PUT /smartrotom/documents/news/:newsId ─────────────────────────────
  describe('PUT /smartrotom/documents/news/:newsId', () => {
    it('returns 200 and delegates to facade.updateNews', async () => {
      (mockFacade.updateNews! as jest.Mock).mockResolvedValue({
        id: 1,
        title: 'Updated',
      } as any);

      const res = await request(app.getHttpServer())
        .put('/smartrotom/documents/news/1')
        .send({ id: 1, title: 'Updated News', content: 'New content' });

      expect(res.status).toBe(200);
      expect(mockFacade.updateNews).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  // ==================== DELETE /smartrotom/documents/news/:newsId (admin) ====================

  // ── DELETE /smartrotom/documents/news/:newsId ──────────────────────────
  describe('DELETE /smartrotom/documents/news/:newsId', () => {
    it('returns 200 and delegates to facade.deleteNews', async () => {
      (mockFacade.deleteNews! as jest.Mock).mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer()).delete(
        '/smartrotom/documents/news/1',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.deleteNews).toHaveBeenCalledWith(1);
    });
  });

  // ==================== POST /smartrotom/documents/newsstatus (admin) ====================

  // ── POST /smartrotom/documents/newsstatus ──────────────────────────────
  describe('POST /smartrotom/documents/newsstatus', () => {
    it('returns 201 and delegates to facade.updateNewsStatus', async () => {
      (mockFacade.updateNewsStatus! as jest.Mock).mockResolvedValue({ success: true } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/newsstatus')
        .send({ published: [1, 2], featured: 1 });

      expect(res.status).toBe(201);
      expect(mockFacade.updateNewsStatus).toHaveBeenCalledWith([1, 2], 1);
    });

    it('returns 400 when featured is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/documents/newsstatus')
        .send({ published: [1] });

      expect(res.status).toBe(400);
    });
  });
});
