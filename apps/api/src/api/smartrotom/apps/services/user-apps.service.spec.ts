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
    const mockApp = { id: 1, name: 'Test App', active: true };

    it('should add app to player successfully', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);
      userAppsRepository.findUserApp.mockResolvedValue(null);
      userAppsRepository.findByPlayerUuid.mockResolvedValue([]);
      userAppsRepository.addUserApp.mockResolvedValue(undefined);

      const result = await service.addAppToPlayer(uuid, appId);

      expect(result).toEqual({ success: true });
      expect(appsRepository.findById).toHaveBeenCalledWith(appId);
      expect(userAppsRepository.findUserApp).toHaveBeenCalledWith(uuid, appId);
      // Slot 0, not 1. `order` is the 0-based grid cell, so starting the scan at
      // 1 left the first app a player was ever given in the SECOND slot.
      expect(userAppsRepository.addUserApp).toHaveBeenCalledWith(uuid, appId, 0);
    });

    it('fills the lowest FREE cell, not the next one up', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);
      userAppsRepository.findUserApp.mockResolvedValue(null);
      userAppsRepository.findByPlayerUuid.mockResolvedValue([
        { appId: 7, order: 0 },
        { appId: 8, order: 2 },
      ]);
      userAppsRepository.addUserApp.mockResolvedValue(undefined);

      await service.addAppToPlayer(uuid, appId);

      expect(userAppsRepository.addUserApp).toHaveBeenCalledWith(uuid, appId, 1);
    });

    it('throws ConflictException when every grid cell is taken', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);
      userAppsRepository.findUserApp.mockResolvedValue(null);
      userAppsRepository.findByPlayerUuid.mockResolvedValue(
        Array.from({ length: 48 }, (_, i) => ({ appId: 100 + i, order: i })),
      );

      await expect(service.addAppToPlayer(uuid, appId)).rejects.toThrow(
        ConflictException,
      );
      expect(userAppsRepository.addUserApp).not.toHaveBeenCalled();
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
      appsRepository.findById.mockResolvedValue({ ...mockApp, active: false });

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
      { id: 1, order: 0 },
      { id: 2, order: 1 },
    ];

    it('should order apps successfully', async () => {
      const existingApps = [{ appId: 1 }, { appId: 2 }];
      userAppsRepository.findByPlayerUuid.mockResolvedValue(existingApps);
      userAppsRepository.updateOrder.mockResolvedValue(undefined);

      const result = await service.orderAppsForPlayer(order, uuid);

      expect(result).toEqual({ success: true });
      expect(userAppsRepository.findByPlayerUuid).toHaveBeenCalledWith(uuid);
      expect(userAppsRepository.updateOrder).toHaveBeenCalledTimes(2);
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
      await expect(
        service.orderAppsForPlayer(null as any, uuid),
      ).rejects.toThrow(BadRequestException);
    });

    it('ignores unknown app ids and compacts the omitted ones into free cells', async () => {
      const existingApps = [{ appId: 1 }, { appId: 3 }];
      userAppsRepository.findByPlayerUuid.mockResolvedValue(existingApps);
      userAppsRepository.updateOrder.mockResolvedValue(undefined);

      await service.orderAppsForPlayer(order, uuid);

      // order names ids [1, 2]; the player owns [1, 3] — only id 1 is placed
      // explicitly, at the slot the payload asked for.
      expect(userAppsRepository.updateOrder).toHaveBeenCalledWith(uuid, 1, 0);
      // App 3 was left out of the payload. It must land in the lowest free cell.
      // The old code passed [3] to `resetOrderExcept`, which resets everything
      // NOT in that list — so it wiped app 1's brand-new order and parked it at
      // 999, off the end of the grid, where the dock stops rendering it.
      expect(userAppsRepository.updateOrder).toHaveBeenCalledWith(uuid, 3, 1);
      expect(userAppsRepository.updateOrder).toHaveBeenCalledTimes(2);
    });

    it('rejects a slot outside the grid instead of hiding the app', async () => {
      userAppsRepository.findByPlayerUuid.mockResolvedValue([{ appId: 1 }]);

      await expect(
        service.orderAppsForPlayer([{ id: 1, order: 999 }], uuid),
      ).rejects.toThrow(BadRequestException);
      expect(userAppsRepository.updateOrder).not.toHaveBeenCalled();
    });

    it('rejects two apps claiming the same cell', async () => {
      userAppsRepository.findByPlayerUuid.mockResolvedValue([
        { appId: 1 },
        { appId: 2 },
      ]);

      await expect(
        service.orderAppsForPlayer(
          [
            { id: 1, order: 3 },
            { id: 2, order: 3 },
          ],
          uuid,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(userAppsRepository.updateOrder).not.toHaveBeenCalled();
    });
  });
});
