import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { MhwildsController } from './mhwilds.controller';
import { MhwildsFacadeService } from './mhwilds.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { GameOrUserAuthGuard } from '@api/_utils/guards/game-or-user-auth.guard';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockFacade = {
  getWeapons: jest.fn(),
  getArmor: jest.fn(),
  getCharms: jest.fn(),
  getDecorations: jest.fn(),
  getSkills: jest.fn(),
  getAllCharmRanks: jest.fn(),
  createWeaponTree: jest.fn(),
  searchWeaponsByName: jest.fn(),
  getWeaponsByKind: jest.fn(),
  getArmorByRarity: jest.fn(),
  getDataStatistics: jest.fn(),
  clearCache: jest.fn(),
  getCacheStatistics: jest.fn(),
  warmupCache: jest.fn(),
  validateCache: jest.fn(),
  optimizeCache: jest.fn(),
  getSupportedLocales: jest.fn(),
  getAvailableResources: jest.fn(),
};

describe('MhwildsController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MhwildsController],
      providers: [
        { provide: MhwildsFacadeService, useValue: mockFacade },
        ResponseInterceptor,
        Reflector,
      ],
    })
      // Guards are stubbed: this suite is about validation and error
      // shape, not about who may call the route.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GameOrUserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();

    // These routes are not public: the identity that would otherwise come from

    // the URL or the body is taken from the authenticated principal.

    // This suite covers the ValidationPipe and the exception filter, so it

    // runs as a signed-in caller; the guards themselves are unit-tested.

    app.use((req: any, _res: any, next: any) => {
      req.user = {
        userId: 1,

        username: 'tester',

        roles: ['BOFF_ADMIN', 'ROTOM_ADMIN'],

        mcUuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      };

      next();
    });
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

  // ── GET /tools/mhwilds/weapons ───────────────────────────────────────────

  describe('GET /tools/mhwilds/weapons', () => {
    it('returns 200 and delegates to facade.getWeapons with default locale', async () => {
      mockFacade.getWeapons.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getWeapons).toHaveBeenCalledWith('es');
    });

    it('accepts valid locale query param', async () => {
      mockFacade.getWeapons.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons?locale=en',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getWeapons).toHaveBeenCalledWith('en');
    });

    it('returns 400 when locale is not a valid enum value', async () => {
      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons?locale=invalid',
      );

      expect(res.status).toBe(400);
    });
  });

  // ── GET /tools/mhwilds/armor ─────────────────────────────────────────────

  describe('GET /tools/mhwilds/armor', () => {
    it('returns 200 and delegates to facade.getArmor', async () => {
      mockFacade.getArmor.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/armor',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getArmor).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/charms ────────────────────────────────────────────

  describe('GET /tools/mhwilds/charms', () => {
    it('returns 200 and delegates to facade.getCharms', async () => {
      mockFacade.getCharms.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/charms',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCharms).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/charms/ranks ─────────────────────────────────────

  describe('GET /tools/mhwilds/charms/ranks', () => {
    it('returns 200 and delegates to facade.getAllCharmRanks', async () => {
      mockFacade.getAllCharmRanks.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/charms/ranks',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAllCharmRanks).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/decorations ──────────────────────────────────────

  describe('GET /tools/mhwilds/decorations', () => {
    it('returns 200 and delegates to facade.getDecorations', async () => {
      mockFacade.getDecorations.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/decorations',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getDecorations).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/skills ────────────────────────────────────────────

  describe('GET /tools/mhwilds/skills', () => {
    it('returns 200 and delegates to facade.getSkills', async () => {
      mockFacade.getSkills.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/skills',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSkills).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/weapons/tree ─────────────────────────────────────

  describe('GET /tools/mhwilds/weapons/tree', () => {
    it('returns 200 and delegates to facade.createWeaponTree', async () => {
      mockFacade.createWeaponTree.mockResolvedValue({ nodes: [] });

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons/tree',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.createWeaponTree).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/weapons/search ───────────────────────────────────

  describe('GET /tools/mhwilds/weapons/search', () => {
    it('returns 200 and delegates to facade.searchWeaponsByName', async () => {
      mockFacade.searchWeaponsByName.mockResolvedValue([]);

      // The q param is a raw @Query('q') — not part of GetWeaponsDto.
      // The class-level @UsePipes(whitelist:true) strips it from the DTO
      // but still passes it as the raw searchTerm argument.
      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons/search',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.searchWeaponsByName).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /tools/mhwilds/weapons/kind/:kind ───────────────────────────────

  describe('GET /tools/mhwilds/weapons/kind/:kind', () => {
    it('returns 200 and delegates to facade.getWeaponsByKind with valid kind', async () => {
      mockFacade.getWeaponsByKind.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons/kind/great-sword',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getWeaponsByKind).toHaveBeenCalledWith(
        'es',
        'great-sword',
      );
    });
  });

  // ── GET /tools/mhwilds/armor/rarity/:rarity ─────────────────────────────

  describe('GET /tools/mhwilds/armor/rarity/:rarity', () => {
    it('returns 200 and delegates to facade.getArmorByRarity with valid rarity', async () => {
      mockFacade.getArmorByRarity.mockResolvedValue([]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/armor/rarity/5',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getArmorByRarity).toHaveBeenCalledWith('es', 5);
    });
  });

  // ── GET /tools/mhwilds/statistics ───────────────────────────────────────

  describe('GET /tools/mhwilds/statistics', () => {
    it('returns 200 and delegates to facade.getDataStatistics', async () => {
      mockFacade.getDataStatistics.mockResolvedValue({ total: 42 });

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/statistics',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getDataStatistics).toHaveBeenCalledWith('es');
    });
  });

  // ── GET /tools/mhwilds/locales ───────────────────────────────────────────

  describe('GET /tools/mhwilds/locales', () => {
    it('returns 200 and delegates to facade.getSupportedLocales', async () => {
      mockFacade.getSupportedLocales.mockResolvedValue(['es', 'en', 'ja']);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/locales',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getSupportedLocales).toHaveBeenCalledTimes(1);
    });
  });

  // ── GET /tools/mhwilds/resources ────────────────────────────────────────

  describe('GET /tools/mhwilds/resources', () => {
    it('returns 200 and delegates to facade.getAvailableResources', async () => {
      mockFacade.getAvailableResources.mockResolvedValue([
        'weapons',
        'armor',
        'charms',
      ]);

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/resources',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getAvailableResources).toHaveBeenCalledTimes(1);
    });
  });

  // ── DELETE /tools/mhwilds/cache ──────────────────────────────────────────

  describe('DELETE /tools/mhwilds/cache', () => {
    it('returns 200 and delegates to facade.clearCache with no filters', async () => {
      mockFacade.clearCache.mockResolvedValue({ cleared: true });

      const res = await request(app.getHttpServer()).delete(
        '/tools/mhwilds/cache',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.clearCache).toHaveBeenCalledWith(undefined, undefined);
    });

    it('returns 400 when resourceType is not a valid enum value', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/tools/mhwilds/cache?resourceType=invalid',
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when locale query param is not a valid enum value', async () => {
      const res = await request(app.getHttpServer()).delete(
        '/tools/mhwilds/cache?locale=invalid',
      );

      expect(res.status).toBe(400);
    });
  });

  // ── GET /tools/mhwilds/cache/statistics ──────────────────────────────────

  describe('GET /tools/mhwilds/cache/statistics', () => {
    it('returns 200 and delegates to facade.getCacheStatistics', async () => {
      mockFacade.getCacheStatistics.mockResolvedValue({ hits: 0, misses: 0 });

      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/cache/statistics',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCacheStatistics).toHaveBeenCalledTimes(1);
    });
  });

  // ── POST /tools/mhwilds/cache/warmup — WarmupCacheDto ───────────────────

  describe('POST /tools/mhwilds/cache/warmup — WarmupCacheDto validation', () => {
    it('returns 201 and calls facade.warmupCache with default locale when body is empty', async () => {
      mockFacade.warmupCache.mockResolvedValue({ warmed: true });

      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/warmup')
        .send({});

      expect(res.status).toBe(201);
      expect(mockFacade.warmupCache).toHaveBeenCalledWith('es');
    });

    it('returns 201 and calls facade.warmupCache with provided locale', async () => {
      mockFacade.warmupCache.mockResolvedValue({ warmed: true });

      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/warmup')
        .send({ locale: 'en' });

      expect(res.status).toBe(201);
      expect(mockFacade.warmupCache).toHaveBeenCalledWith('en');
    });

    it('returns 400 when locale is not a valid enum value', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/warmup')
        .send({ locale: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when unknown field is present (forbidNonWhitelisted)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/warmup')
        .send({ locale: 'en', unknownField: 'value' });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /tools/mhwilds/cache/validate — ValidateCacheDto ───────────────

  describe('POST /tools/mhwilds/cache/validate — ValidateCacheDto validation', () => {
    it('returns 201 and calls facade.validateCache with default locale when body is empty', async () => {
      mockFacade.validateCache.mockResolvedValue({ valid: true });

      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/validate')
        .send({});

      expect(res.status).toBe(201);
      expect(mockFacade.validateCache).toHaveBeenCalledWith('es');
    });
  });

  // ── POST /tools/mhwilds/cache/optimize ───────────────────────────────────

  describe('POST /tools/mhwilds/cache/optimize', () => {
    it('returns 201 and delegates to facade.optimizeCache', async () => {
      mockFacade.optimizeCache.mockResolvedValue({ optimized: true });

      const res = await request(app.getHttpServer())
        .post('/tools/mhwilds/cache/optimize')
        .send({});

      expect(res.status).toBe(201);
      expect(mockFacade.optimizeCache).toHaveBeenCalledTimes(1);
    });
  });

  // ── GlobalExceptionFilter — error shape contract ─────────────────────────

  describe('GlobalExceptionFilter — error shape contract', () => {
    it('all error responses include statusCode, error, message, timestamp, path', async () => {
      const res = await request(app.getHttpServer()).get(
        '/tools/mhwilds/weapons?locale=invalid',
      );

      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });
  });
});
