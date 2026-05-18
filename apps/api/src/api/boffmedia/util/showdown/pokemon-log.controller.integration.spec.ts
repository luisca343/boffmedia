import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { PokemonLogController } from './pokemon-log.controller';
import { PokemonLogService } from './pokemon-log.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockService = {
  processShowdownLogs: jest.fn(),
  parseShowdownLog: jest.fn(),
};

describe('PokemonLogController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PokemonLogController],
      providers: [
        { provide: PokemonLogService, useValue: mockService },
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

  // ── GET /pokemon-log/process/:spreadsheetId ───────────────────────────────

  describe('GET /pokemon-log/process/:spreadsheetId', () => {
    it('processes logs and returns summary', async () => {
      mockService.processShowdownLogs.mockResolvedValue({ processed: 5, errors: 0 });
      const res = await request(app.getHttpServer())
        .get('/pokemon-log/process/sheet123');

      expect(res.status).toBeLessThan(300);
      expect(mockService.processShowdownLogs).toHaveBeenCalledWith('sheet123');
      expect(res.body).toMatchObject({ processed: 5, errors: 0 });
      expect(res.body.message).toContain('5 logs processed');
    });

    it('returns 500 when service throws', async () => {
      mockService.processShowdownLogs.mockRejectedValue(new Error('sheet error'));
      await request(app.getHttpServer())
        .get('/pokemon-log/process/badsheet')
        .expect(500);
    });
  });

  // ── GET /pokemon-log/test-parse ───────────────────────────────────────────

  describe('GET /pokemon-log/test-parse', () => {
    it('parses sample log and returns result', async () => {
      mockService.parseShowdownLog.mockReturnValue({ players: ['p1', 'p2'], turns: 10 });
      const res = await request(app.getHttpServer())
        .get('/pokemon-log/test-parse');

      expect(res.status).toBeLessThan(300);
      expect(mockService.parseShowdownLog).toHaveBeenCalled();
      expect(res.body).toMatchObject({ players: ['p1', 'p2'] });
    });
  });
});
