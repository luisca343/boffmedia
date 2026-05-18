import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ArcadeFacadeService } from './arcade.facade.service';
import { StreakService } from './services/streak.service';
import { InventoryService } from './services/inventory.service';
import { LootboxService } from './services/lootbox.service';
import { WingullFacadeService } from '../wingull/wingull.facade.service';
import { Logger } from 'nestjs-pino';

const mockStreak = {
  uuid: 'test-uuid',
  currentStreak: 3,
  lastClaim: new Date(),
  maxStreak: 7,
};

const mockInventoryItem = {
  id: 'item-1',
  uuid: 'test-uuid',
  itemId: 'lootbox_basic',
  itemType: 'lootbox',
  amount: 1,
  rarity: 'common',
};

describe('ArcadeFacadeService', () => {
  let service: ArcadeFacadeService;
  let streakService: jest.Mocked<StreakService>;
  let inventoryService: jest.Mocked<InventoryService>;
  let lootboxService: jest.Mocked<LootboxService>;
  let wingullFacadeService: jest.Mocked<WingullFacadeService>;

  beforeEach(async () => {
    const mockStreakService = {
      getUserStreak: jest.fn(),
      canClaimReward: jest.fn(),
      claimDailyReward: jest.fn(),
      resetUserStreak: jest.fn(),
      getStreakStats: jest.fn(),
      updateLastBanner: jest.fn(),
    };
    const mockInventoryService = {
      getUserInventory: jest.fn(),
      getUserItem: jest.fn(),
      addItemToInventory: jest.fn(),
      consumeItem: jest.fn(),
      removeItem: jest.fn(),
      getInventoryStats: jest.fn(),
      getItemsByType: jest.fn(),
      getItemsByRarity: jest.fn(),
      markItemAsUsed: jest.fn(),
    };
    const mockLootboxService = {
      getLootboxConfig: jest.fn(),
      openLootBox: jest.fn(),
      giveLootbox: jest.fn(),
    };
    const mockWingullFacadeService = {
      givePokemon: jest.fn(),
      giveItems: jest.fn(),
    };
    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArcadeFacadeService,
        { provide: StreakService, useValue: mockStreakService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: LootboxService, useValue: mockLootboxService },
        { provide: WingullFacadeService, useValue: mockWingullFacadeService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ArcadeFacadeService>(ArcadeFacadeService);
    streakService = module.get(StreakService);
    inventoryService = module.get(InventoryService);
    lootboxService = module.get(LootboxService);
    wingullFacadeService = module.get(WingullFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserStreak', () => {
    it('should return user streak', async () => {
      (streakService.getUserStreak as jest.Mock).mockResolvedValue(mockStreak);

      const result = await service.getUserStreak('test-uuid');

      expect(streakService.getUserStreak).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockStreak);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.getUserStreak('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('canClaimDailyReward', () => {
    it('should return canClaim status and streak', async () => {
      (streakService.canClaimReward as jest.Mock).mockResolvedValue({
        canClaim: true,
        streak: mockStreak,
      });

      const result = await service.canClaimDailyReward('test-uuid');

      expect(result.canClaim).toBe(true);
      expect(result.streak).toEqual(mockStreak);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.canClaimDailyReward('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('claimDailyReward', () => {
    it('should return streak and reward when no inventory item', async () => {
      (streakService.claimDailyReward as jest.Mock).mockResolvedValue({
        streak: mockStreak,
        reward: { type: 'coins', amount: 100 },
      });

      const result = await service.claimDailyReward('test-uuid');

      expect(result.streak).toEqual(mockStreak);
      expect(result.reward).toBeDefined();
    });

    it('should add inventory item when reward type is box', async () => {
      (streakService.claimDailyReward as jest.Mock).mockResolvedValue({
        streak: mockStreak,
        reward: { type: 'box', description: 'lootbox_basic', amount: 1 },
      });
      (inventoryService.addItemToInventory as jest.Mock).mockResolvedValue({
        item: mockInventoryItem,
      });

      const result = await service.claimDailyReward('test-uuid');

      expect(inventoryService.addItemToInventory).toHaveBeenCalled();
      expect(result.inventoryItems).toHaveLength(1);
    });

    it('should return null reward when streak returns no reward', async () => {
      (streakService.claimDailyReward as jest.Mock).mockResolvedValue({
        streak: mockStreak,
        reward: null,
      });

      const result = await service.claimDailyReward('test-uuid');

      expect(result.reward).toBeNull();
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.claimDailyReward('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetUserStreak', () => {
    it('should reset user streak when reset succeeds', async () => {
      (streakService.resetUserStreak as jest.Mock).mockResolvedValue({ success: true });

      await service.resetUserStreak('test-uuid');

      expect(streakService.resetUserStreak).toHaveBeenCalledWith('test-uuid');
    });

    it('should throw NotFoundException when reset fails', async () => {
      (streakService.resetUserStreak as jest.Mock).mockResolvedValue({ success: false });

      await expect(service.resetUserStreak('test-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.resetUserStreak('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStreakStats', () => {
    it('should return streak stats', async () => {
      (streakService.getStreakStats as jest.Mock).mockResolvedValue(mockStreak);

      const result = await service.getStreakStats('test-uuid');

      expect(streakService.getStreakStats).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockStreak);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.getStreakStats('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateLastBanner', () => {
    it('should update last banner', async () => {
      (streakService.updateLastBanner as jest.Mock).mockResolvedValue(mockStreak);

      const result = await service.updateLastBanner('test-uuid', 'spring_banner');

      expect(streakService.updateLastBanner).toHaveBeenCalledWith('test-uuid', 'spring_banner');
      expect(result).toEqual(mockStreak);
    });

    it('should throw BadRequestException when uuid or banner is empty', async () => {
      await expect(service.updateLastBanner('', 'banner')).rejects.toThrow(BadRequestException);
      await expect(service.updateLastBanner('uuid', '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserInventory', () => {
    it('should return user inventory', async () => {
      const inventory = { items: [mockInventoryItem], total: 1 };
      (inventoryService.getUserInventory as jest.Mock).mockResolvedValue(inventory);

      const result = await service.getUserInventory('test-uuid');

      expect(inventoryService.getUserInventory).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(inventory);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.getUserInventory('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserItem', () => {
    it('should return specific inventory item', async () => {
      (inventoryService.getUserItem as jest.Mock).mockResolvedValue(mockInventoryItem);

      const result = await service.getUserItem('test-uuid', 'lootbox_basic');

      expect(inventoryService.getUserItem).toHaveBeenCalledWith('test-uuid', 'lootbox_basic');
      expect(result).toEqual(mockInventoryItem);
    });

    it('should return null when item not found', async () => {
      (inventoryService.getUserItem as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserItem('test-uuid', 'unknown');

      expect(result).toBeNull();
    });

    it('should throw BadRequestException when uuid or itemId is empty', async () => {
      await expect(service.getUserItem('', 'item-1')).rejects.toThrow(BadRequestException);
      await expect(service.getUserItem('uuid', '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('addItemToInventory', () => {
    it('should add item and return the created item', async () => {
      (inventoryService.addItemToInventory as jest.Mock).mockResolvedValue({
        item: mockInventoryItem,
      });

      const result = await service.addItemToInventory({
        uuid: 'test-uuid',
        itemId: 'lootbox_basic',
        itemType: 'lootbox',
        amount: 1,
      });

      expect(inventoryService.addItemToInventory).toHaveBeenCalled();
      expect(result).toEqual(mockInventoryItem);
    });

    it('should throw BadRequestException when required fields missing', async () => {
      await expect(
        service.addItemToInventory({ uuid: '', itemId: 'x', itemType: 'lootbox', amount: 1 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('consumeInventoryItem', () => {
    it('should consume item and return result', async () => {
      (inventoryService.consumeItem as jest.Mock).mockResolvedValue({
        success: true,
        item: mockInventoryItem,
        consumed: 1,
      });

      const result = await service.consumeInventoryItem('test-uuid', 'lootbox_basic', 1);

      expect(inventoryService.consumeItem).toHaveBeenCalledWith('test-uuid', 'lootbox_basic', 1);
      expect(result.consumed).toBe(1);
    });

    it('should throw BadRequestException when consume fails', async () => {
      (inventoryService.consumeItem as jest.Mock).mockResolvedValue({
        success: false,
        item: null,
        consumed: 0,
      });

      await expect(service.consumeInventoryItem('test-uuid', 'lootbox_basic', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when amount < 1', async () => {
      await expect(service.consumeInventoryItem('test-uuid', 'item-1', 0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeInventoryItem', () => {
    it('should remove item when successful', async () => {
      (inventoryService.removeItem as jest.Mock).mockResolvedValue({ success: true });

      await service.removeInventoryItem('test-uuid', 'lootbox_basic');

      expect(inventoryService.removeItem).toHaveBeenCalledWith('test-uuid', 'lootbox_basic');
    });

    it('should throw BadRequestException when remove fails', async () => {
      (inventoryService.removeItem as jest.Mock).mockResolvedValue({ success: false });

      await expect(service.removeInventoryItem('test-uuid', 'lootbox_basic')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLootboxConfig', () => {
    it('should return lootbox configuration', async () => {
      const config = { boxes: [{ id: 'basic' }] };
      (lootboxService.getLootboxConfig as jest.Mock).mockResolvedValue(config);

      const result = await service.getLootboxConfig();

      expect(lootboxService.getLootboxConfig).toHaveBeenCalledTimes(1);
      expect(result).toEqual(config);
    });
  });

  describe('openLootbox', () => {
    it('should open lootbox and return prize', async () => {
      (lootboxService.openLootBox as jest.Mock).mockResolvedValue({
        item: mockInventoryItem,
        spinnerItems: [mockInventoryItem],
        winningPosition: 3,
      });

      const result = await service.openLootbox('test-uuid', 'basic');

      expect(lootboxService.openLootBox).toHaveBeenCalledWith({ uuid: 'test-uuid', boxId: 'basic' });
      expect(result.item).toEqual(mockInventoryItem);
    });

    it('should throw BadRequestException when uuid or lootboxType is empty', async () => {
      await expect(service.openLootbox('', 'basic')).rejects.toThrow(BadRequestException);
      await expect(service.openLootbox('uuid', '')).rejects.toThrow(BadRequestException);
    });
  });

  describe('giveLootbox', () => {
    it('should give lootbox to user', async () => {
      (lootboxService.giveLootbox as jest.Mock).mockResolvedValue({ success: true });

      await service.giveLootbox('test-uuid', 'basic', 1);

      expect(lootboxService.giveLootbox).toHaveBeenCalledWith('test-uuid', 'basic', 1);
    });

    it('should throw BadRequestException when give fails', async () => {
      (lootboxService.giveLootbox as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Lootbox not available',
      });

      await expect(service.giveLootbox('test-uuid', 'basic', 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount < 1', async () => {
      await expect(service.giveLootbox('test-uuid', 'basic', 0)).rejects.toThrow(BadRequestException);
    });
  });

  describe('claimItems', () => {
    it('should claim valid items and return summary', async () => {
      (inventoryService.consumeItem as jest.Mock).mockResolvedValue({
        success: true,
        item: mockInventoryItem,
        consumed: 1,
      });
      (wingullFacadeService.giveItems as jest.Mock).mockResolvedValue(undefined);

      const result = await service.claimItems({
        uuid: 'test-uuid',
        items: [
          {
            id: 1,
            uuid: 'test-uuid',
            itemId: 'pokeball',
            itemType: 'item',
            amount: 1,
            rarity: 'common' as any,
            sourceType: 'manual',
            used: 0,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.claimedItems).toContain('pokeball');
    });

    it('should throw BadRequestException when uuid is missing', async () => {
      await expect(
        service.claimItems({ uuid: '', items: [{ id: 1, uuid: 'u', itemId: 'x', itemType: 'item', amount: 1, rarity: 'common' as any, sourceType: 'manual', used: 0 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when items array is empty', async () => {
      await expect(service.claimItems({ uuid: 'test-uuid', items: [] })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCompleteUserData', () => {
    it('should return streak, inventory and inventoryStats in parallel', async () => {
      const inventory = { items: [], total: 0 };
      const stats = { totalItems: 0, itemsByType: {}, itemsByRarity: {} };
      (streakService.getUserStreak as jest.Mock).mockResolvedValue(mockStreak);
      (inventoryService.getUserInventory as jest.Mock).mockResolvedValue(inventory);
      (inventoryService.getInventoryStats as jest.Mock).mockResolvedValue(stats);

      const result = await service.getCompleteUserData('test-uuid');

      expect(result.streak).toEqual(mockStreak);
      expect(result.inventory).toEqual(inventory);
      expect(result.inventoryStats).toEqual(stats);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.getCompleteUserData('')).rejects.toThrow(BadRequestException);
    });
  });
});
