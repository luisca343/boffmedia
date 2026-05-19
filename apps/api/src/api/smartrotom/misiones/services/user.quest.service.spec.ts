import { Test, TestingModule } from '@nestjs/testing';
import { UserQuestService } from './user.quest.service';
import { QuestCacheService } from './quest.cache.service';
import { QUEST_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  fetchUserQuestsFromAPI: jest.fn(),
};

const mockQuestCache = {
  getQuestSystemData: jest.fn(),
};

const systemQuests = [
  { id: 1, name: 'Main Quest', status: 'available', objectives: [] },
  { id: 2, name: 'Side Quest', status: 'locked', objectives: [] },
];

const systemData = {
  quests: systemQuests,
  dialogs: [{ id: 1, text: 'Welcome' }],
  categories: [{ id: 1, name: 'Main' }],
  npcs: [],
};

const userApiResponse = {
  quests: {
    '1': {
      id: 1,
      status: 'in_progress',
      objectives: [{ id: 1, completed: true }],
    },
  },
};

describe('UserQuestService', () => {
  let service: UserQuestService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserQuestService,
        { provide: QUEST_REPOSITORY_TOKEN, useValue: mockRepo },
        { provide: QuestCacheService, useValue: mockQuestCache },
      ],
    }).compile();

    service = module.get<UserQuestService>(UserQuestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUserQuests ────────────────────────────────────────────────────────────

  describe('getUserQuests()', () => {
    it('merges system and user quest data', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue(systemData);
      mockRepo.fetchUserQuestsFromAPI.mockResolvedValue(userApiResponse);

      const result = await service.getUserQuests('player-uuid');

      // Quest 1 should have user progress merged in
      const quest1 = result.quests.find((q) => q.id === 1);
      expect(quest1!.status).toBe('in_progress');

      // Quest 2 has no user data — keeps system defaults
      const quest2 = result.quests.find((q) => q.id === 2);
      expect(quest2!.status).toBe('locked');
    });

    it('returns system dialogs, categories and npcs unchanged', async () => {
      mockQuestCache.getQuestSystemData.mockResolvedValue(systemData);
      mockRepo.fetchUserQuestsFromAPI.mockResolvedValue({ quests: {} });

      const result = await service.getUserQuests('player-uuid');

      expect(result.dialogs).toEqual(systemData.dialogs);
      expect(result.categories).toEqual(systemData.categories);
      expect(result.npcs).toEqual(systemData.npcs);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getUserQuests('')).rejects.toThrow(
        'UUID is required',
      );
    });

    it('throws when uuid is whitespace only', async () => {
      await expect(service.getUserQuests('   ')).rejects.toThrow(
        'UUID is required',
      );
    });
  });

  // ─── validateUserExists ───────────────────────────────────────────────────────

  describe('validateUserExists()', () => {
    it('returns true when user API call succeeds', async () => {
      mockRepo.fetchUserQuestsFromAPI.mockResolvedValue(userApiResponse);

      await expect(service.validateUserExists('player-uuid')).resolves.toBe(
        true,
      );
    });

    it('returns false when API call throws', async () => {
      mockRepo.fetchUserQuestsFromAPI.mockRejectedValue(new Error('Not found'));

      await expect(service.validateUserExists('unknown')).resolves.toBe(false);
    });
  });
});
