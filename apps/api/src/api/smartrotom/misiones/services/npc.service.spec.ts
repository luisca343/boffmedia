import { Test, TestingModule } from '@nestjs/testing';
import { NPCService } from './npc.service';
import { QuestCacheService } from './quest.cache.service';

const mockQuestCache = {
  getQuestSystemData: jest.fn(),
  updateNPCs: jest.fn(),
};

const makeNPC = (id: number, questId = 1) =>
  ({
    id,
    name: `NPC ${id}`,
    text: 'Hello',
    questId,
    requirements: {
      available: true,
      requiredQuests: [],
      requiredDialogs: [],
      requiredLevel: 0,
      requiredTime: 0,
      factionRequirements: [],
      scoreboardRequirements: [],
    },
  }) as any;

describe('NPCService', () => {
  let service: NPCService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NPCService,
        { provide: QuestCacheService, useValue: mockQuestCache },
      ],
    }).compile();

    service = module.get<NPCService>(NPCService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── updateNPCs ───────────────────────────────────────────────────────────────

  describe('updateNPCs()', () => {
    it('filters out invalid NPCs and updates cache', async () => {
      const validNPC = { id: 1, name: 'Oak', text: 'Hello!', questId: 1 };
      const invalidNPC = { id: 'bad', name: '', text: 'hi', questId: 1 };

      const result = await service.updateNPCs({ npcs: [validNPC, invalidNPC] as any });

      expect(result.updated).toBe(1);
      expect(result.status).toBe('ok');
      expect(mockQuestCache.updateNPCs).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 1 })]),
      );
    });

    it('throws when npcs is not provided', async () => {
      await expect(service.updateNPCs({ npcs: null as any })).rejects.toThrow(
        'NPCs array is required',
      );
    });

    it('throws when no valid NPCs remain after filtering', async () => {
      await expect(
        service.updateNPCs({ npcs: [{ id: 'bad', name: '', text: '', questId: 'x' }] as any }),
      ).rejects.toThrow('No valid NPCs provided');
    });

    it('trims and normalizes NPC data', async () => {
      const npc = { id: 2, name: '  Brock  ', text: 'Training!', questId: 3 };

      await service.updateNPCs({ npcs: [npc] as any });

      expect(mockQuestCache.updateNPCs).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'Brock' })]),
      );
    });
  });

  // ─── getAllNPCs ───────────────────────────────────────────────────────────────

  describe('getAllNPCs()', () => {
    it('returns npcs from quest cache', async () => {
      const npcs = [makeNPC(1), makeNPC(2)];
      mockQuestCache.getQuestSystemData.mockResolvedValue({ npcs });

      await expect(service.getAllNPCs()).resolves.toEqual(npcs);
    });
  });

  // ─── getNPCById ───────────────────────────────────────────────────────────────

  describe('getNPCById()', () => {
    it('returns NPC when found', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue({
        npcs: [makeNPC(1), makeNPC(2)],
      });

      await expect(service.getNPCById(2)).resolves.toEqual(
        expect.objectContaining({ id: 2 }),
      );
    });

    it('returns null when NPC not found', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue({ npcs: [makeNPC(1)] });

      await expect(service.getNPCById(99)).resolves.toBeNull();
    });
  });

  // ─── getNPCsByQuestId ─────────────────────────────────────────────────────────

  describe('getNPCsByQuestId()', () => {
    it('returns NPCs matching questId', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue({
        npcs: [makeNPC(1, 5), makeNPC(2, 5), makeNPC(3, 6)],
      });

      const result = await service.getNPCsByQuestId(5);

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.questId === 5)).toBe(true);
    });

    it('returns empty array when no NPCs match', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue({ npcs: [makeNPC(1, 1)] });

      await expect(service.getNPCsByQuestId(99)).resolves.toEqual([]);
    });
  });
});
