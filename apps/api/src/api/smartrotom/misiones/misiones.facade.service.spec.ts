import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MisionesFacadeService } from './misiones.facade.service';
import { QuestCacheService } from './services/quest.cache.service';
import { UserQuestService } from './services/user.quest.service';
import { NPCService } from './services/npc.service';
import { ImageService } from './services/image.service';

const mockQuestData = { quests: [], lastUpdated: new Date() };
const mockNpc = { id: 1, name: 'Professor Oak', questId: 1 };

describe('MisionesFacadeService', () => {
  let service: MisionesFacadeService;
  let questCacheService: jest.Mocked<
    Pick<QuestCacheService, 'getQuestSystemData' | 'refreshCache' | 'getCacheStatus'>
  >;
  let userQuestService: jest.Mocked<
    Pick<UserQuestService, 'getUserQuests' | 'validateUserExists'>
  >;
  let npcService: jest.Mocked<
    Pick<NPCService, 'updateNPCs' | 'getAllNPCs' | 'getNPCById' | 'getNPCsByQuestId'>
  >;
  let imageService: jest.Mocked<
    Pick<ImageService, 'uploadCustomNPCImage' | 'checkCustomNPCRenderExists' | 'checkCustomNPCImageExists'>
  >;

  beforeEach(async () => {
    const mockQuestCacheService = {
      getQuestSystemData: jest.fn(),
      refreshCache: jest.fn(),
      getCacheStatus: jest.fn(),
    };
    const mockUserQuestService = {
      getUserQuests: jest.fn(),
      validateUserExists: jest.fn(),
    };
    const mockNpcService = {
      updateNPCs: jest.fn(),
      getAllNPCs: jest.fn(),
      getNPCById: jest.fn(),
      getNPCsByQuestId: jest.fn(),
    };
    const mockImageService = {
      uploadCustomNPCImage: jest.fn(),
      checkCustomNPCRenderExists: jest.fn(),
      checkCustomNPCImageExists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MisionesFacadeService,
        { provide: QuestCacheService, useValue: mockQuestCacheService },
        { provide: UserQuestService, useValue: mockUserQuestService },
        { provide: NPCService, useValue: mockNpcService },
        { provide: ImageService, useValue: mockImageService },
      ],
    }).compile();

    service = module.get<MisionesFacadeService>(MisionesFacadeService);
    questCacheService = module.get(QuestCacheService);
    userQuestService = module.get(UserQuestService);
    npcService = module.get(NPCService);
    imageService = module.get(ImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllQuests', () => {
    it('should return quest system data without force refresh', async () => {
      questCacheService.getQuestSystemData.mockResolvedValue(mockQuestData as any);

      const result = await service.getAllQuests();

      expect(questCacheService.getQuestSystemData).toHaveBeenCalledWith(false);
      expect(result).toEqual(mockQuestData);
    });

    it('should force cache refresh when force=1', async () => {
      questCacheService.getQuestSystemData.mockResolvedValue(mockQuestData as any);

      await service.getAllQuests(1);

      expect(questCacheService.getQuestSystemData).toHaveBeenCalledWith(true);
    });
  });

  describe('getQuestsForUser', () => {
    it('should return quests for a specific user', async () => {
      const userData = { quests: [], completedQuests: [] };
      userQuestService.getUserQuests.mockResolvedValue(userData as any);

      const result = await service.getQuestsForUser('test-uuid');

      expect(userQuestService.getUserQuests).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(userData);
    });

    it('should throw BadRequestException when uuid is empty', async () => {
      await expect(service.getQuestsForUser('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshQuestCache', () => {
    it('should refresh cache and return success response', async () => {
      questCacheService.refreshCache.mockResolvedValue(undefined);

      const result = await service.refreshQuestCache();

      expect(questCacheService.refreshCache).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getCacheStatus', () => {
    it('should return cache status', async () => {
      questCacheService.getCacheStatus.mockReturnValue({
        cached: true,
        age: 3600,
        nextRefresh: 18000,
      });

      const result = await service.getCacheStatus();

      expect(questCacheService.getCacheStatus).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('healthy');
    });
  });

  describe('updateNPCs', () => {
    it('should delegate NPC updates to npcService', async () => {
      npcService.updateNPCs.mockResolvedValue({ success: true, updated: 3 } as any);

      const result = await service.updateNPCs({ npcs: [] } as any);

      expect(npcService.updateNPCs).toHaveBeenCalled();
    });
  });

  describe('getAllNPCs', () => {
    it('should return all NPCs', async () => {
      npcService.getAllNPCs.mockResolvedValue([mockNpc] as any);

      const result = await service.getAllNPCs();

      expect(npcService.getAllNPCs).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockNpc]);
    });
  });

  describe('getNPCById', () => {
    it('should return NPC by id', async () => {
      npcService.getNPCById.mockResolvedValue(mockNpc as any);

      const result = await service.getNPCById(1);

      expect(npcService.getNPCById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockNpc);
    });

    it('should throw BadRequestException when id is 0 or negative', async () => {
      await expect(service.getNPCById(0)).rejects.toThrow(BadRequestException);
      await expect(service.getNPCById(-1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNPCsByQuestId', () => {
    it('should return NPCs for quest', async () => {
      npcService.getNPCsByQuestId.mockResolvedValue([mockNpc] as any);

      const result = await service.getNPCsByQuestId(1);

      expect(npcService.getNPCsByQuestId).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockNpc]);
    });
  });

  describe('uploadNPCImage', () => {
    it('should upload NPC image', async () => {
      imageService.uploadCustomNPCImage.mockResolvedValue({ status: 'SUCCESS', path: '/npc/oak.png' });

      const result = await service.uploadNPCImage({ npcName: 'oak', image: 'base64data' } as any);

      expect(imageService.uploadCustomNPCImage).toHaveBeenCalled();
      expect(result.status).toBe('SUCCESS');
    });

    it('should throw when npcName is missing', async () => {
      await expect(service.uploadNPCImage({ npcName: '', image: 'data' } as any)).rejects.toThrow();
    });
  });

  describe('checkNPCRenderExists', () => {
    it('should check if render exists', async () => {
      imageService.checkCustomNPCRenderExists.mockResolvedValue({ exists: true } as any);

      const result = await service.checkNPCRenderExists('oak');

      expect(imageService.checkCustomNPCRenderExists).toHaveBeenCalledWith('oak');
      expect(result.exists).toBe(true);
    });
  });

  describe('checkNPCImageExists', () => {
    it('should check if image exists', async () => {
      imageService.checkCustomNPCImageExists.mockResolvedValue({ exists: false } as any);

      const result = await service.checkNPCImageExists('unknown');

      expect(result.exists).toBe(false);
    });
  });

  describe('validateUserExists', () => {
    it('should return true when user has quest data', async () => {
      userQuestService.validateUserExists.mockResolvedValue(true);

      const result = await service.validateUserExists('test-uuid');

      expect(result).toBe(true);
    });

    it('should return false when user has no quest data', async () => {
      userQuestService.validateUserExists.mockResolvedValue(false);

      const result = await service.validateUserExists('new-uuid');

      expect(result).toBe(false);
    });
  });
});
