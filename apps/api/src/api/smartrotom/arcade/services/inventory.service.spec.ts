import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { InventoryService } from './inventory.service';
import { ARCADE_INVENTORY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  findUserInventory: jest.fn(),
  findUserItem: jest.fn(),
  findById: jest.fn(),
  addItem: jest.fn(),
  consumeItem: jest.fn(),
  removeItem: jest.fn(),
  getTotalItems: jest.fn(),
  getItemsByType: jest.fn(),
  getItemsByRarity: jest.fn(),
  update: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const makeItem = (id: number, itemId: string, itemType: string, amount = 1, rarity = 'common') =>
  ({ id, itemId, itemType, amount, rarity, used: 0, sourceType: 'test' }) as any;

const UUID = 'player-uuid';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: Logger, useValue: mockLogger },
        { provide: ARCADE_INVENTORY_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUserInventory ─────────────────────────────────────────────────────────

  describe('getUserInventory()', () => {
    it('aggregates items with same itemId for non-consumable types', async () => {
      mockRepo.findUserInventory.mockResolvedValue([
        makeItem(1, 'sword-1', 'weapon', 1),
        makeItem(2, 'sword-1', 'weapon', 1), // same itemId, non-consumable → different key (id, used, source)
      ]);

      const result = await service.getUserInventory(UUID);

      expect(result.rawItems).toHaveLength(2);
      expect(result.items).toBeDefined();
      expect(result.groupedItems['weapon']).toBeDefined();
    });

    it('aggregates consumable items with same itemId into one slot', async () => {
      mockRepo.findUserInventory.mockResolvedValue([
        makeItem(1, 'lootbox-basic', 'lootbox', 2),
        makeItem(2, 'lootbox-basic', 'lootbox', 3),
      ]);

      const result = await service.getUserInventory(UUID);

      const lootboxSlot = result.items.find((i: any) => i.itemId === 'lootbox-basic');
      // consumable: net = total amount - used = 5 - 0 = 5
      expect(lootboxSlot.amount).toBe(5);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getUserInventory('')).rejects.toThrow('UUID is required');
    });
  });

  // ─── getUserItem ──────────────────────────────────────────────────────────────

  describe('getUserItem()', () => {
    it('returns item from repo', async () => {
      const item = makeItem(1, 'sword-1', 'weapon');
      mockRepo.findUserItem.mockResolvedValue(item);

      await expect(service.getUserItem(UUID, 'sword-1')).resolves.toEqual(item);
      expect(mockRepo.findUserItem).toHaveBeenCalledWith(UUID, 'sword-1');
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getUserItem('', 'sword-1')).rejects.toThrow('UUID is required');
    });

    it('throws when itemId is empty', async () => {
      await expect(service.getUserItem(UUID, '')).rejects.toThrow('Item ID is required');
    });
  });

  // ─── addItemToInventory ───────────────────────────────────────────────────────

  describe('addItemToInventory()', () => {
    it('adds item and returns it', async () => {
      const item = makeItem(10, 'sword-1', 'weapon');
      mockRepo.addItem.mockResolvedValue({ insertId: 10 });
      mockRepo.findById.mockResolvedValue(item);

      const result = await service.addItemToInventory({
        uuid: UUID,
        itemId: 'sword-1',
        itemType: 'weapon',
        amount: 1,
      });

      expect(result.success).toBe(true);
      expect(result.item).toEqual(item);
    });

    it('defaults rarity to common and sourceType to unknown', async () => {
      mockRepo.addItem.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue(makeItem(1, 'sword-1', 'weapon'));

      await service.addItemToInventory({ uuid: UUID, itemId: 'sword-1', itemType: 'weapon', amount: 1 });

      expect(mockRepo.addItem).toHaveBeenCalledWith(
        expect.objectContaining({ rarity: 'common', sourceType: 'unknown' }),
      );
    });

    it('throws when amount is 0', async () => {
      await expect(
        service.addItemToInventory({ uuid: UUID, itemId: 'sword-1', itemType: 'weapon', amount: 0 }),
      ).rejects.toThrow('Amount must be greater than 0');
    });
  });

  // ─── removeItem ───────────────────────────────────────────────────────────────

  describe('removeItem()', () => {
    it('removes item and returns success message', async () => {
      mockRepo.findUserItem.mockResolvedValue(makeItem(1, 'sword-1', 'weapon'));
      mockRepo.removeItem.mockResolvedValue(true);

      const result = await service.removeItem(UUID, 'sword-1');

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed successfully');
    });

    it('throws NotFoundException when item not in inventory', async () => {
      mockRepo.findUserItem.mockResolvedValue(null);

      await expect(service.removeItem(UUID, 'ghost')).rejects.toThrow('Item not found');
    });
  });

  // ─── getInventoryStats ────────────────────────────────────────────────────────

  describe('getInventoryStats()', () => {
    it('returns itemsByType and itemsByRarity counts', async () => {
      mockRepo.findUserInventory.mockResolvedValue([
        makeItem(1, 'sword', 'weapon', 2, 'common'),
        makeItem(2, 'axe', 'weapon', 1, 'rare'),
        makeItem(3, 'ruby', 'material', 5, 'common'),
      ]);
      mockRepo.getTotalItems.mockResolvedValue(8);

      const result = await service.getInventoryStats(UUID);

      expect(result.totalItems).toBe(8);
      expect(result.itemsByType['weapon']).toBe(3); // 2 + 1
      expect(result.itemsByType['material']).toBe(5);
      expect(result.itemsByRarity['common']).toBe(7); // 2 + 5
      expect(result.itemsByRarity['rare']).toBe(1);
    });
  });
});
