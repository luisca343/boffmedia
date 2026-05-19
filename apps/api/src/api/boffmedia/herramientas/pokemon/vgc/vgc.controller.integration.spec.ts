import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { VgcController } from './vgc.controller';
import { VgcService } from './vgc.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const MOCK_POKEMON = [{ name: 'Pikachu', types: ['Electric'] }];
const MOCK_SPEED_TIERS = [{ pokemon: 'Pikachu', baseSpeed: 110, tiers: [] }];
const MOCK_REGULATION = { id: 'vgc2026regma', formatId: 'gen9vgc2026regd' };

const mockVgcService = {
  getRegulationById: jest.fn(),
  getLegalPokemon: jest.fn(),
  getSpeedTiers: jest.fn(),
};

describe('VgcController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [VgcController],
      providers: [
        { provide: VgcService, useValue: mockVgcService },
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

  // ── GET /tools/vgc/champions/:regulationId/pokemon ───────────────────────

  describe('GET /tools/vgc/champions/:regulationId/pokemon', () => {
    it('returns 200 and delegates to vgcService.getLegalPokemon when regulation exists', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(MOCK_REGULATION);
      mockVgcService.getLegalPokemon.mockResolvedValue(MOCK_POKEMON);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/vgc2026regma/pokemon',
      );

      expect(res.status).toBe(200);
      expect(mockVgcService.getRegulationById).toHaveBeenCalledWith(
        'vgc2026regma',
      );
      expect(mockVgcService.getLegalPokemon).toHaveBeenCalledWith(
        MOCK_REGULATION.formatId,
      );
    });

    it('returns 404 when regulation does not exist', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/unknown-regulation/pokemon',
      );

      expect(res.status).toBe(404);
      expect(mockVgcService.getLegalPokemon).not.toHaveBeenCalled();
    });

    it('returns empty array when regulation exists but has no legal pokemon', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(MOCK_REGULATION);
      mockVgcService.getLegalPokemon.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/vgc2026regma/pokemon',
      );

      expect(res.status).toBe(200);
    });
  });

  // ── GET /tools/vgc/champions/:regulationId/speed-tiers ──────────────────

  describe('GET /tools/vgc/champions/:regulationId/speed-tiers', () => {
    it('returns 200 and delegates to vgcService.getSpeedTiers when regulation exists', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(MOCK_REGULATION);
      mockVgcService.getSpeedTiers.mockResolvedValue(MOCK_SPEED_TIERS);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/vgc2026regma/speed-tiers',
      );

      expect(res.status).toBe(200);
      expect(mockVgcService.getRegulationById).toHaveBeenCalledWith(
        'vgc2026regma',
      );
      expect(mockVgcService.getSpeedTiers).toHaveBeenCalledWith(
        MOCK_REGULATION.formatId,
      );
    });

    it('returns 404 when regulation does not exist', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/unknown-regulation/speed-tiers',
      );

      expect(res.status).toBe(404);
      expect(mockVgcService.getSpeedTiers).not.toHaveBeenCalled();
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('404 responses include statusCode, error, message, timestamp, path', async () => {
      mockVgcService.getRegulationById.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(
        '/tools/vgc/champions/bad-id/pokemon',
      );

      expect(res.body).toHaveProperty('statusCode', 404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
