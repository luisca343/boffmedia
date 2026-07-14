import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { NetfluisController } from './netfluis.controller';
import { NetfluisService } from './netfluis.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockService = {
  test: jest.fn(),
};

describe('NetfluisController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NetfluisController],
      providers: [
        { provide: NetfluisService, useValue: mockService },
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

  // ── GET /smartrotom/netfluis/test ─────────────────────────────────────────

  describe('GET /smartrotom/netfluis/test', () => {
    it('returns test result', async () => {
      mockService.test.mockResolvedValue({ ok: true });
      const res = await request(app.getHttpServer()).get(
        '/smartrotom/netfluis/test',
      );

      expect(res.status).toBeLessThan(300);
      expect(mockService.test).toHaveBeenCalled();
      expect(res.body.data).toMatchObject({ ok: true });
    });

    it('returns 500 when service throws', async () => {
      mockService.test.mockRejectedValue(new Error('service error'));
      await request(app.getHttpServer())
        .get('/smartrotom/netfluis/test')
        .expect(500);
    });
  });
});
