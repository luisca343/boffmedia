import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { UserAppsService } from './user-apps.service';
import { AppsRepository } from '@api/smartrotom/apps/repositories/apps.repository';

describe('UserAppsService', () => {
  let service: UserAppsService;
  let repository: AppsRepository;

  const mockAppsRepository = {
    getAppsForPlayer: jest.fn(),
    findActiveApp: jest.fn(),
    findUserApp: jest.fn(),
    addUserApp: jest.fn(),
    removeUserApp: jest.fn(),
    findUserApps: jest.fn(),
    updateUserAppOrder: jest.fn(),
    resetUserAppOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAppsService,
        { provide: AppsRepository, useValue: mockAppsRepository },
      ],
    }).compile();

    service = module.get<UserAppsService>(UserAppsService);
    repository = module.get<AppsRepository>(AppsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAppsForPlayer', () => {
    it('should return apps for valid uuid', async () => {
      const uuid = 'test-uuid';
      const mockApps = [{ id: 1, name: 'Test App' }];
      mockAppsRepository.getAppsForPlayer.mockResolvedValue(mockApps);

      const result = await service.getAppsForPlayer(uuid);

      expect(result).toEqual(mockApps);
      expect(repository.getAppsForPlayer).toHaveBeenCalledWith(uuid);
    });

    it('should return empty array for empty uuid', async () => {
      const result = await service.getAppsForPlayer('');

      expect(result).toEqual([]);
      expect(repository.getAppsForPlayer).not.toHaveBeenCalled();
    });

    it('should return empty array for null uuid', async () => {
      const result = await service.getAppsForPlayer(null);

      expect(result).toEqual([]);
      expect(repository.getAppsForPlayer).not.toHaveBeenCalled();
    });
  });

  describe('addAppToPlayer', () => {
    const uuid = 'test-uuid';
    const appId = 1;

    it('should add app to player successfully', async () => {
      const mockApp = { id: 1, name: 'Test App' };
      mockAppsRepository.findActiveApp.mockResolvedValue(mockApp);
      mockAppsRepository.findUserApp.mockResolvedValue(null);
      mockAppsRepository.addUserApp.mockResolvedValue({ insertId: 1 });

      const result = await service.addAppToPlayer(uuid, appId);

      expect(result).toEqual({ success: true });
      expect(repository.findActiveApp).toHaveBeenCalledWith(appId);
      expect(repository.findUserApp).toHaveBeenCalledWith(uuid, appId);
      expect(repository.addUserApp).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid uuid', async () => {
      await expect(service.addAppToPlayer('', appId)).rejects.toThrow(BadRequestException);
      await expect(service.addAppToPlayer(null, appId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid appId', async () => {
      await expect(service.addAppToPlayer(uuid, 0)).rejects.toThrow(BadRequestException);
      await expect(service.addAppToPlayer(uuid, null)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when app not found or not active', async () => {
      mockAppsRepository.findActiveApp.mockResolvedValue(null);

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when app already added', async () => {
      const mockApp = { id: 1, name: 'Test App' };
      const mockUserApp = { uuid, appId, order: 1 };
      mockAppsRepository.findActiveApp.mockResolvedValue(mockApp);
      mockAppsRepository.findUserApp.mockResolvedValue(mockUserApp);

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(ConflictException);
    });
  });

  describe('removeAppFromPlayer', () => {
    const uuid = 'test-uuid';
    const appId = 1;

    it('should remove app from player successfully', async () => {
      mockAppsRepository.removeUserApp.mockResolvedValue({ affectedRows: 1 });

      const result = await service.removeAppFromPlayer(uuid, appId);

      expect(result).toEqual({ success: true });
      expect(repository.removeUserApp).toHaveBeenCalledWith(uuid, appId);
    });

    it('should throw BadRequestException for invalid parameters', async () => {
      await expect(service.removeAppFromPlayer('', appId)).rejects.toThrow(BadRequestException);
      await expect(service.removeAppFromPlayer(uuid, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when app not found in player list', async () => {
      mockAppsRepository.removeUserApp.mockResolvedValue({ affectedRows: 0 });

      await expect(service.removeAppFromPlayer(uuid, appId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('orderAppsForPlayer', () => {
    const uuid = 'test-uuid';
    const order = [{ id: 1, order: 1 }, { id: 2, order: 2 }];

    it('should order apps successfully', async () => {
      const existingApps = [{ appId: 1 }, { appId: 2 }];
      mockAppsRepository.findUserApps.mockResolvedValue(existingApps);
      mockAppsRepository.updateUserAppOrder.mockResolvedValue(undefined);
      mockAppsRepository.resetUserAppOrder.mockResolvedValue(undefined);

      const result = await service.orderAppsForPlayer(order, uuid);

      expect(result).toEqual({ success: true });
      expect(repository.findUserApps).toHaveBeenCalledWith(uuid);
      expect(repository.updateUserAppOrder).toHaveBeenCalledTimes(2);
      expect(repository.resetUserAppOrder).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid parameters', async () => {
      await expect(service.orderAppsForPlayer([], '')).rejects.toThrow(BadRequestException);
      await expect(service.orderAppsForPlayer(null, uuid)).rejects.toThrow(BadRequestException);
    });

    it('should filter out non-existing apps', async () => {
      const existingApps = [{ appId: 1 }]; // Only app 1 exists
      mockAppsRepository.findUserApps.mockResolvedValue(existingApps);
      mockAppsRepository.updateUserAppOrder.mockResolvedValue(undefined);
      mockAppsRepository.resetUserAppOrder.mockResolvedValue(undefined);

      await service.orderAppsForPlayer(order, uuid);

      // Should only update app 1, not app 2
      expect(repository.updateUserAppOrder).toHaveBeenCalledTimes(1);
      expect(repository.updateUserAppOrder).toHaveBeenCalledWith(uuid, 1, 1);
    });
  });
});