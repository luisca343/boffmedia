import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { ArcadeController } from './arcade.controller';
import { ArcadeFacadeService } from './arcade.facade.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { Reflector } from '@nestjs/core';

const MOCK_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

const mockFacade: jest.Mocked<Partial<ArcadeFacadeService>> = {
  getRewardsBanner: jest.fn(),
  getUserStreak: jest.fn(),
  claimDailyReward: jest.fn(),
  getStreakStats: jest.fn(),
  resetUserStreak: jest.fn(),
  getUserInventory: jest.fn(),
  getInventoryStats: jest.fn(),
  getUserItem: jest.fn(),
  addItemToInventory: jest.fn(),
  consumeInventoryItem: jest.fn(),
  markItemAsUsed: jest.fn(),
  openLootbox: jest.fn(),
  giveLootbox: jest.fn(),
  getLootboxConfig: jest.fn(),
  claimItems: jest.fn(),
  getCompleteUserData: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('ArcadeController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArcadeController],
      providers: [
        { provide: ArcadeFacadeService, useValue: mockFacade },
        { provide: Reflector, useValue: new Reflector() },
      ],
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
    app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => jest.clearAllMocks());

  // ==================== GET /smartrotom/arcade ====================

  // ── GET /smartrotom/arcade ─────────────────────────────────────────────
  describe('GET /smartrotom/arcade', () => {
    it('returns 200', async () => {
      const res = await request(app.getHttpServer()).get('/smartrotom/arcade');
      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /smartrotom/arcade/banner ====================

  // ── GET /smartrotom/arcade/banner ──────────────────────────────────────
  describe('GET /smartrotom/arcade/banner', () => {
    it('returns 200 and delegates to facade.getRewardsBanner', async () => {
      (mockFacade.getRewardsBanner! as jest.Mock).mockResolvedValue({
        name: 'Test Banner',
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/arcade/banner',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getRewardsBanner).toHaveBeenCalled();
    });
  });

  // ==================== GET /smartrotom/arcade/streak/:uuid ====================

  // ── GET /smartrotom/arcade/streak/:uuid ────────────────────────────────
  describe('GET /smartrotom/arcade/streak/:uuid', () => {
    it('returns 200 and delegates to facade.getUserStreak', async () => {
      (mockFacade.getUserStreak! as jest.Mock).mockReturnValue({
        streak: 5,
      } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/streak/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserStreak).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== POST /smartrotom/arcade/streak/claim ====================

  // ── POST /smartrotom/arcade/streak/claim ───────────────────────────────
  describe('POST /smartrotom/arcade/streak/claim', () => {
    it('returns 201 and delegates to facade.claimDailyReward', async () => {
      (mockFacade.claimDailyReward! as jest.Mock).mockResolvedValue({
        success: true,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/streak/claim')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(201);
      expect(mockFacade.claimDailyReward).toHaveBeenCalledWith(MOCK_UUID);
    });

    it('returns 400 when uuid is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/streak/claim')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /smartrotom/arcade/streak/:uuid/stats ====================

  // ── GET /smartrotom/arcade/streak/:uuid/stats ──────────────────────────
  describe('GET /smartrotom/arcade/streak/:uuid/stats', () => {
    it('returns 200 and delegates to facade.getStreakStats', async () => {
      (mockFacade.getStreakStats! as jest.Mock).mockResolvedValue({
        streak: 3,
      } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/streak/${MOCK_UUID}/stats`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getStreakStats).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== POST /smartrotom/arcade/streak/:uuid/reset ====================

  // ── POST /smartrotom/arcade/streak/:uuid/reset ─────────────────────────
  describe('POST /smartrotom/arcade/streak/:uuid/reset', () => {
    it('returns 201 and delegates to facade.resetUserStreak', async () => {
      (mockFacade.resetUserStreak! as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).post(
        `/smartrotom/arcade/streak/${MOCK_UUID}/reset`,
      );

      expect(res.status).toBe(201);
      expect(mockFacade.resetUserStreak).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/arcade/inventory/:uuid ====================

  // ── GET /smartrotom/arcade/inventory/:uuid ─────────────────────────────
  describe('GET /smartrotom/arcade/inventory/:uuid', () => {
    it('returns 200 and delegates to facade.getUserInventory', async () => {
      (mockFacade.getUserInventory! as jest.Mock).mockResolvedValue({
        items: [],
      } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/inventory/${MOCK_UUID}`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserInventory).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/arcade/inventory/:uuid/stats ====================

  // ── GET /smartrotom/arcade/inventory/:uuid/stats ───────────────────────
  describe('GET /smartrotom/arcade/inventory/:uuid/stats', () => {
    it('returns 200 and delegates to facade.getInventoryStats', async () => {
      (mockFacade.getInventoryStats! as jest.Mock).mockResolvedValue({
        totalItems: 10,
        itemsByType: {},
        itemsByRarity: {},
      });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/inventory/${MOCK_UUID}/stats`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getInventoryStats).toHaveBeenCalledWith(MOCK_UUID);
    });
  });

  // ==================== GET /smartrotom/arcade/inventory/:uuid/item/:itemId ====================

  // ── GET /smartrotom/arcade/inventory/:uuid/item/:itemId ────────────────
  describe('GET /smartrotom/arcade/inventory/:uuid/item/:itemId', () => {
    it('returns 200 and delegates to facade.getUserItem', async () => {
      (mockFacade.getUserItem! as jest.Mock).mockResolvedValue({
        itemId: 'potion_heal',
      } as any);

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/inventory/${MOCK_UUID}/item/potion_heal`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getUserItem).toHaveBeenCalledWith(
        MOCK_UUID,
        'potion_heal',
      );
    });
  });

  // ==================== POST /smartrotom/arcade/inventory/add ====================

  // ── POST /smartrotom/arcade/inventory/add ──────────────────────────────
  describe('POST /smartrotom/arcade/inventory/add', () => {
    it('returns 201 and delegates to facade.addItemToInventory', async () => {
      (mockFacade.addItemToInventory! as jest.Mock).mockResolvedValue({
        id: 1,
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/inventory/add')
        .send({
          uuid: MOCK_UUID,
          itemId: 'pixelmon:master_ball',
          itemType: 'ITEM',
          name: 'Master Ball',
        });

      expect(res.status).toBe(201);
      expect(mockFacade.addItemToInventory).toHaveBeenCalled();
    });

    it('returns 400 when itemId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/inventory/add')
        .send({ uuid: MOCK_UUID, itemType: 'ITEM', name: 'Master Ball' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/inventory/add')
        .send({
          uuid: MOCK_UUID,
          itemId: 'pixelmon:master_ball',
          itemType: 'ITEM',
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/arcade/inventory/consume ====================

  // ── POST /smartrotom/arcade/inventory/consume ──────────────────────────
  describe('POST /smartrotom/arcade/inventory/consume', () => {
    it('returns 201 and delegates to facade.consumeInventoryItem', async () => {
      (mockFacade.consumeInventoryItem! as jest.Mock).mockResolvedValue({
        item: null,
        consumed: 1,
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/inventory/consume')
        .send({ uuid: MOCK_UUID, itemId: 'trainer_box' });

      expect(res.status).toBe(201);
      expect(mockFacade.consumeInventoryItem).toHaveBeenCalledWith(
        MOCK_UUID,
        'trainer_box',
        1,
      );
    });

    it('returns 400 when itemId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/inventory/consume')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/arcade/inventory/:uuid/item/:itemId/use ====================

  // ── POST /smartrotom/arcade/inventory/:uuid/item/:itemId/use ───────────
  describe('POST /smartrotom/arcade/inventory/:uuid/item/:itemId/use', () => {
    it('returns 201 and delegates to facade.markItemAsUsed', async () => {
      (mockFacade.markItemAsUsed! as jest.Mock).mockResolvedValue({
        id: 1,
      } as any);

      const res = await request(app.getHttpServer()).post(
        `/smartrotom/arcade/inventory/${MOCK_UUID}/item/potion_heal/use`,
      );

      expect(res.status).toBe(201);
      expect(mockFacade.markItemAsUsed).toHaveBeenCalledWith(
        MOCK_UUID,
        'potion_heal',
      );
    });
  });

  // ==================== POST /smartrotom/arcade/lootbox/open ====================

  // ── POST /smartrotom/arcade/lootbox/open ───────────────────────────────
  describe('POST /smartrotom/arcade/lootbox/open', () => {
    it('returns 201 and delegates to facade.openLootbox', async () => {
      (mockFacade.openLootbox! as jest.Mock).mockResolvedValue({
        item: { id: 'master_ball' },
      } as any);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/lootbox/open')
        .send({ uuid: MOCK_UUID, boxId: 'trainer_box' });

      expect(res.status).toBe(201);
      expect(mockFacade.openLootbox).toHaveBeenCalledWith(
        MOCK_UUID,
        'trainer_box',
      );
    });

    it('returns 400 when boxId is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/lootbox/open')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /smartrotom/arcade/lootbox/give ====================

  // ── POST /smartrotom/arcade/lootbox/give ───────────────────────────────
  describe('POST /smartrotom/arcade/lootbox/give', () => {
    it('returns 201 and delegates to facade.giveLootbox', async () => {
      (mockFacade.giveLootbox! as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/lootbox/give')
        .send({ uuid: MOCK_UUID, lootboxType: 'trainer_box' });

      expect(res.status).toBe(201);
      expect(mockFacade.giveLootbox).toHaveBeenCalledWith(
        MOCK_UUID,
        'trainer_box',
        1,
      );
    });

    it('returns 400 when lootboxType is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/lootbox/give')
        .send({ uuid: MOCK_UUID });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /smartrotom/arcade/lootbox/config ====================

  // ── GET /smartrotom/arcade/lootbox/config ──────────────────────────────
  describe('GET /smartrotom/arcade/lootbox/config', () => {
    it('returns 200 and delegates to facade.getLootboxConfig', async () => {
      (mockFacade.getLootboxConfig! as jest.Mock).mockResolvedValue({
        boxes: [],
      } as any);

      const res = await request(app.getHttpServer()).get(
        '/smartrotom/arcade/lootbox/config',
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getLootboxConfig).toHaveBeenCalled();
    });
  });

  // ==================== POST /smartrotom/arcade/claim-items ====================

  // ── POST /smartrotom/arcade/claim-items ────────────────────────────────
  describe('POST /smartrotom/arcade/claim-items', () => {
    it('returns 201 and delegates to facade.claimItems', async () => {
      (mockFacade.claimItems! as jest.Mock).mockResolvedValue({
        claimedItems: ['pixelmon:master_ball'],
        failedItems: [],
        pokemonItems: [],
        regularItems: ['pixelmon:master_ball'],
        success: true,
        message: 'ok',
      });

      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/claim-items')
        .send({
          uuid: MOCK_UUID,
          items: [
            {
              id: 1,
              uuid: MOCK_UUID,
              itemId: 'pixelmon:master_ball',
              itemType: 'item',
              amount: 1,
              rarity: 'rare',
              sourceType: 'lootbox',
              used: 0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(mockFacade.claimItems).toHaveBeenCalled();
    });

    it('returns 400 when items array is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/smartrotom/arcade/claim-items')
        .send({ uuid: MOCK_UUID, items: [] });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /smartrotom/arcade/user/:uuid/complete-data ====================

  // ── GET /smartrotom/arcade/user/:uuid/complete-data ────────────────────
  describe('GET /smartrotom/arcade/user/:uuid/complete-data', () => {
    it('returns 200 and delegates to facade.getCompleteUserData', async () => {
      (mockFacade.getCompleteUserData! as jest.Mock).mockResolvedValue({
        streak: {} as any,
        inventory: {} as any,
        inventoryStats: { totalItems: 0, itemsByType: {}, itemsByRarity: {} },
      });

      const res = await request(app.getHttpServer()).get(
        `/smartrotom/arcade/user/${MOCK_UUID}/complete-data`,
      );

      expect(res.status).toBe(200);
      expect(mockFacade.getCompleteUserData).toHaveBeenCalledWith(MOCK_UUID);
    });
  });
});
