import { Test, TestingModule } from '@nestjs/testing';
import { LootboxService } from './lootbox.service';
import { ARCADE_INVENTORY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

jest.mock('../_config/lootboxConfig', () => ({
  getRarityFromWeight: jest.fn().mockReturnValue('common'),
  rarityRanges: { common: { min: 50, max: 100 } },
  lootboxConfig: {
    boxes: [
      {
        id: 'basic-box',
        name: 'Basic Box',
        image: 'box.png',
        description: 'A basic box',
        theme: 'basic',
        items: [
          { id: 'item-1', weight: 70, type: 'weapon' },
          { id: 'item-2', weight: 30, type: 'material' },
        ],
      },
    ],
  },
}));

const mockRepo = {
  findUserItem: jest.fn(),
  consumeItem: jest.fn(),
  addItem: jest.fn(),
};

describe('LootboxService', () => {
  let service: LootboxService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LootboxService,
        { provide: ARCADE_INVENTORY_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<LootboxService>(LootboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── openLootBox ──────────────────────────────────────────────────────────────

  describe('openLootBox()', () => {
    it('consumes a box and adds the selected item to inventory', async () => {
      mockRepo.findUserItem.mockResolvedValue({
        id: 1,
        itemId: 'basic-box',
        amount: 3,
      });
      mockRepo.consumeItem.mockResolvedValue(undefined);
      mockRepo.addItem.mockResolvedValue({ insertId: 10 });

      const result = await service.openLootBox({
        uuid: 'player-uuid',
        boxId: 'basic-box',
      });

      expect(mockRepo.consumeItem).toHaveBeenCalledWith(
        'player-uuid',
        'basic-box',
        1,
      );
      expect(mockRepo.addItem).toHaveBeenCalled();
      expect(result.item).toBeDefined();
      expect(result.spinnerItems).toHaveLength(300);
      expect(result.winningPosition).toBeGreaterThanOrEqual(0);
    });

    it('throws when box configuration is not found', async () => {
      await expect(
        service.openLootBox({ uuid: 'player-uuid', boxId: 'unknown-box' }),
      ).rejects.toThrow('Box not found');
    });

    it('throws when user has no boxes in inventory', async () => {
      mockRepo.findUserItem.mockResolvedValue(null);

      await expect(
        service.openLootBox({ uuid: 'player-uuid', boxId: 'basic-box' }),
      ).rejects.toThrow('No boxes available');
    });

    it('throws when user box amount is 0', async () => {
      mockRepo.findUserItem.mockResolvedValue({
        id: 1,
        itemId: 'basic-box',
        amount: 0,
      });

      await expect(
        service.openLootBox({ uuid: 'player-uuid', boxId: 'basic-box' }),
      ).rejects.toThrow('No boxes available');
    });
  });

  // ─── giveLootbox ──────────────────────────────────────────────────────────────

  describe('giveLootbox()', () => {
    it('adds lootbox to user inventory and returns success', async () => {
      mockRepo.addItem.mockResolvedValue({ insertId: 5 });

      const result = await service.giveLootbox('player-uuid', 'basic-box', 2);

      expect(result.success).toBe(true);
      expect(result.message).toContain('basic-box');
      expect(mockRepo.addItem).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: 'player-uuid',
          itemId: 'basic-box',
          itemType: 'lootbox',
          amount: 2,
        }),
      );
    });

    it('throws when boxId does not exist in config', async () => {
      await expect(
        service.giveLootbox('player-uuid', 'mystery-box'),
      ).rejects.toThrow('Lootbox not found');
    });
  });

  // ─── getLootboxConfig ─────────────────────────────────────────────────────────

  describe('getLootboxConfig()', () => {
    it('returns config entity with rarityRanges and boxes', () => {
      const config = service.getLootboxConfig();

      expect(config.rarityRanges).toBeDefined();
      expect(config.lootboxConfig.boxes).toHaveLength(1);
      expect(config.lootboxConfig.boxes[0].id).toBe('basic-box');
    });
  });
});
