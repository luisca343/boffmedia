import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { SharexController } from './sharex.controller';
import { SharexService } from './sharex.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';

const mockService: jest.Mocked<Partial<SharexService>> = {
  createImage: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('SharexController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharexController],
      providers: [{ provide: SharexService, useValue: mockService }],
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

  // ── POST /sharex ──────────────────────────────────────────────────────────

  describe('POST /sharex', () => {
    it('returns 400 when no file is uploaded', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .field('key', 'secret-key');

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 400 when key is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/sharex')
        .attach('file', Buffer.from('fake image'), 'screenshot-1234567890.png');

      expect(res.status).toBe(400);
      expect(mockService.createImage).not.toHaveBeenCalled();
    });

    it('returns 200 when file and key are provided', async () => {
      (mockService.createImage! as jest.Mock).mockImplementation(() => {});

      const res = await request(app.getHttpServer())
        .post('/sharex')
        .attach('file', Buffer.from('fake image'), 'myapp-1234567890.png')
        .field('key', 'valid-api-key');

      expect(res.status).toBe(201);
      expect(mockService.createImage).toHaveBeenCalled();
      expect(res.body.file).toBeDefined();
    });
  });
});
