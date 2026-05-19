import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockAppService = {
  getHealth: jest.fn(),
  getDBPort: jest.fn(),
  toggleLogging: jest.fn(),
  uploadFile: jest.fn(),
  blogicons: jest.fn(),
  steamKeys: jest.fn(),
  getSteamData: jest.fn(),
};

describe('AppController — integration (smoke tests)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status object', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 123.45,
        connections: { database: true, wingullApi: true },
        memory: {
          rss: '100MB',
          heapTotal: '50MB',
          heapUsed: '30MB',
          external: '5MB',
        },
      };
      mockAppService.getHealth.mockResolvedValue(healthResponse);

      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(mockAppService.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should still return 200 when health check reports degraded state', async () => {
      const degraded = {
        status: 'ok',
        connections: { database: false, wingullApi: false },
      };
      mockAppService.getHealth.mockResolvedValue(degraded);

      const res = await request(app.getHttpServer()).get('/health');

      expect(res.status).toBe(200);
    });
  });
});
