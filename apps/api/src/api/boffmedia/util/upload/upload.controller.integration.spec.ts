import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { UploadController } from './upload.controller';
import { UploadFacadeService } from './upload.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';

const mockFacade: jest.Mocked<Partial<UploadFacadeService>> = {
  uploadImage: jest.fn(),
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileInfo: jest.fn(),
  getSupportedImageTypes: jest.fn(),
  getMaxImageSize: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('UploadController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadFacadeService, useValue: mockFacade }],
    }).compile();

    app = module.createNestApplication();
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

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ── DELETE /upload/file ───────────────────────────────────────────────────

  describe('DELETE /upload/file', () => {
    it('returns 200 and calls facade.deleteFile', async () => {
      (mockFacade.deleteFile! as jest.Mock).mockResolvedValue({
        success: true,
        message: 'File deleted',
      });

      const res = await request(app.getHttpServer())
        .delete('/upload/file')
        .send({ filename: 'test.jpg', path: 'avatars' });

      expect(res.status).toBe(200);
      expect(mockFacade.deleteFile).toHaveBeenCalledWith('avatars', 'test.jpg');
    });

    it('returns 200 when path is omitted (defaults to empty string)', async () => {
      (mockFacade.deleteFile! as jest.Mock).mockResolvedValue({
        success: true,
        message: 'File deleted',
      });

      const res = await request(app.getHttpServer())
        .delete('/upload/file')
        .send({ filename: 'test.jpg' });

      expect(res.status).toBe(200);
      expect(mockFacade.deleteFile).toHaveBeenCalledWith('', 'test.jpg');
    });
  });

  // ==================== GET /upload/info ====================

  describe('GET /upload/info', () => {
    it('returns 200 and calls facade.getFileInfo', async () => {
      (mockFacade.getFileInfo! as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        filename: 'test.jpg',
        path: '',
      } as any);

      const res = await request(app.getHttpServer())
        .get('/upload/info')
        .query({ filename: 'test.jpg', path: 'avatars' });

      expect(res.status).toBe(200);
      expect(mockFacade.getFileInfo).toHaveBeenCalledWith(
        'avatars',
        'test.jpg',
      );
    });

    it('returns 400 when filename is missing', async () => {
      const res = await request(app.getHttpServer())
        .get('/upload/info')
        .query({ path: 'avatars' });

      expect(res.status).toBe(400);
      expect(mockFacade.getFileInfo).not.toHaveBeenCalled();
    });

    it('returns 200 when path is omitted', async () => {
      (mockFacade.getFileInfo! as jest.Mock).mockResolvedValue({ exists: true } as any);

      const res = await request(app.getHttpServer())
        .get('/upload/info')
        .query({ filename: 'test.jpg' });

      expect(res.status).toBe(200);
      expect(mockFacade.getFileInfo).toHaveBeenCalledWith('', 'test.jpg');
    });
  });

  // ==================== GET /upload/supported-types ====================

  describe('GET /upload/supported-types', () => {
    it('returns 200 and the list of supported types', async () => {
      (mockFacade.getSupportedImageTypes! as jest.Mock).mockReturnValue([
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
      ]);

      const res = await request(app.getHttpServer()).get(
        '/upload/supported-types',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSupportedImageTypes).toHaveBeenCalled();
      expect(res.body.data.supportedTypes).toEqual([
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
      ]);
    });
  });

  // ==================== GET /upload/limits ====================

  describe('GET /upload/limits', () => {
    it('returns 200 and upload limits', async () => {
      (mockFacade.getMaxImageSize! as jest.Mock).mockReturnValue(5 * 1024 * 1024);

      const res = await request(app.getHttpServer()).get('/upload/limits');

      expect(res.status).toBe(200);
      expect(mockFacade.getMaxImageSize).toHaveBeenCalled();
      expect(res.body.data.maxImageSizeBytes).toBe(5 * 1024 * 1024);
      expect(res.body.data.maxImageSizeMB).toBe(5);
    });
  });
});
