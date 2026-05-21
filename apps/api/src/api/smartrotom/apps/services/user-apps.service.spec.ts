import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserAppsService } from './user-apps.service';
import {
  APPS_REPOSITORY_TOKEN,
  USER_APPS_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/repository.token';

describe('UserAppsService', () => {
  let service: UserAppsService;
  let userAppsRepository: {
    getAppsForPlayer: jest.Mock;
    findByPlayerUuid: jest.Mock;
    findUserApp: jest.Mock;
    addUserApp: jest.Mock;
    removeUserApp: jest.Mock;
    updateOrder: jest.Mock;
    resetOrderExcept: jest.Mock;
  };
  let appsRepository: { findById: jest.Mock };

  beforeEach(async () => {
    userAppsRepository = {
      getAppsForPlayer: jest.fn(),
      findByPlayerUuid: jest.fn(),
      findUserApp: jest.fn(),
      addUserApp: jest.fn(),
      removeUserApp: jest.fn(),
      updateOrder: jest.fn(),
      resetOrderExcept: jest.fn(),
    };

    appsRepository = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAppsService,
        { provide: USER_APPS_REPOSITORY_TOKEN, useValue: userAppsRepository },
        { provide: APPS_REPOSITORY_TOKEN, useValue: appsRepository },
      ],
    }).compile();

    service = module.get<UserAppsService>(UserAppsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAppsForPlayer', () => {
    it('should return apps for valid uuid', async () => {
      const uuid = 'test-uuid';
      const mockApps = [{ id: 1, name: 'Test App' }];
      userAppsRepository.getAppsForPlayer.mockResolvedValue(mockApps);

      const result = await service.getAppsForPlayer(uuid);

      expect(result).toEqual(mockApps);
      expect(userAppsRepository.getAppsForPlayer).toHaveBeenCalledWith(uuid);
    });

    it('should throw BadRequestException for empty uuid', async () => {
      await expect(service.getAppsForPlayer('')).rejects.toThrow(
        BadRequestException,
      );
      expect(userAppsRepository.getAppsForPlayer).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for null uuid', async () => {
      await expect(service.getAppsForPlayer(null as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(userAppsRepository.getAppsForPlayer).not.toHaveBeenCalled();
    });
  });

  describe('addAppToPlayer', () => {
    const uuid = 'test-uuid';
    const appId = 1;
    const mockApp = { id: 1, name: 'Test App', active: 1 };

    it('should add app to player successfully', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);
      userAppsRepository.findUserApp.mockResolvedValue(null);
      userAppsRepository.findByPlayerUuid.mockResolvedValue([]);
      userAppsRepository.addUserApp.mockResolvedValue(undefined);

      const result = await service.addAppToPlayer(uuid, appId);

      expect(result).toEqual({ success: true });
      expect(appsRepository.findById).toHaveBeenCalledWith(appId);
      expect(userAppsRepository.findUserApp).toHaveBeenCalledWith(uuid, appId);
      expect(userAppsRepository.addUserApp).toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty uuid', async () => {
      await expect(service.addAppToPlayer('', appId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for null uuid', async () => {
      await expect(service.addAppToPlayer(null as any, appId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid appId (0)', async () => {
      await expect(service.addAppToPlayer(uuid, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for null appId', async () => {
      await expect(service.addAppToPlayer(uuid, null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when app not found', async () => {
      appsRepository.findById.mockResolvedValue(null);

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when app is inactive', async () => {
      appsRepository.findById.mockResolvedValue({ ...mockApp, active: 0 });

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when app already added', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);
      userAppsRepository.findUserApp.mockResolvedValue({
        uuid,
        appId,
        order: 1,
      });

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeAppFromPlayer', () => {
    const uuid = 'test-uuid';
    const appId = 1;

    it('should remove app from player successfully', async () => {
      userAppsRepository.removeUserApp.mockResolvedValue(true);

      const result = await service.removeAppFromPlayer(uuid, appId);

      expect(result).toEqual({ success: true });
      expect(userAppsRepository.removeUserApp).toHaveBeenCalledWith(
        uuid,
        appId,
      );
    });

    it('should throw BadRequestException for empty uuid', async () => {
      await expect(service.removeAppFromPlayer('', appId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid appId', async () => {
      await expect(service.removeAppFromPlayer(uuid, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when app not found in player list', async () => {
      userAppsRepository.removeUserApp.mockResolvedValue(false);

      await expect(service.removeAppFromPlayer(uuid, appId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('orderAppsForPlayer', () => {
    const uuid = 'test-uuid';
    const order = [
      { id: 1, order: 1 },
      { id: 2, order: 2 },
    ];

    it('should order apps successfully', async () => {
      const existingApps = [{ appId: 1 }, { appId: 2 }];
      userAppsRepository.findByPlayerUuid.mockResolvedValue(existingApps);
      userAppsRepository.updateOrder.mockResolvedValue(undefined);

      const result = await service.orderAppsForPlayer(order, uuid);

      expect(result).toEqual({ success: true });
      expect(userAppsRepository.findByPlayerUuid).toHaveBeenCalledWith(uuid);
      expect(userAppsRepository.updateOrder).toHaveBeenCalledTimes(2);
      expect(userAppsRepository.resetOrderExcept).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty uuid', async () => {
      await expect(service.orderAppsForPlayer(order, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for empty order array', async () => {
      await expect(service.orderAppsForPlayer([], uuid)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for null order', async () => {
      await expect(service.orderAppsForPlayer(null as any, uuid)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should filter out non-existing apps and reset remainder', async () => {
      const existingApps = [{ appId: 1 }, { appId: 3 }];
      userAppsRepository.findByPlayerUuid.mockResolvedValue(existingApps);
      userAppsRepository.updateOrder.mockResolvedValue(undefined);
      userAppsRepository.resetOrderExcept.mockResolvedValue(undefined);

      await service.orderAppsForPlayer(order, uuid);

      // order has ids [1, 2]; existingApps has [1, 3] — only id 1 is valid
      expect(userAppsRepository.updateOrder).toHaveBeenCalledTimes(1);
      expect(userAppsRepository.updateOrder).toHaveBeenCalledWith(uuid, 1, 1);
      // app 3 is in existingApps but not in validOrder — reset its order
      expect(userAppsRepository.resetOrderExcept).toHaveBeenCalledWith(
        uuid,
        [3],
      );
    });
  });
});
