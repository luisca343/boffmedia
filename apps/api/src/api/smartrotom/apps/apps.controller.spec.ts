import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AppsController } from './apps.controller';
import { AppsFacadeService } from './apps.facade.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { OrderAppDto } from './dto/order-apps.dto';
import { PlayerAppDto } from './dto/player-app.dto';
import { GetPlayerAppsDto } from './dto/get-player-apps.dto';
import { SmartRotomApp } from './entities/app.entity';
import { SuccessResponse } from '@api/_utils/entities/common-response.entity';

describe('AppsController', () => {
  let controller: AppsController;
  let facadeService: AppsFacadeService;

  const mockAppsData: SmartRotomApp[] = [
    {
      id: 1,
      name: 'ChatApp',
      url: 'chatapp',
      active: 1,
    },
    {
      id: 2,
      name: 'Admin',
      url: 'admin',
      active: 0,
    },
  ];

  const mockAppData: SmartRotomApp = {
    id: 1,
    name: 'ChatApp',
    url: 'chatapp',
    active: 1,
  };

  const mockPlayerAppsData: SmartRotomApp[] = [
    {
      id: 2,
      name: 'Admin',
      url: 'admin',
      active: 1,
    },
    {
      id: 3,
      name: 'Arcade',
      url: 'arcade',
      active: 0,
    },
  ];

  const _mockSuccessResponse: SuccessResponse = {
    success: true,
    message: 'Operation completed successfully',
  };

  const mockAppsFacadeService = {
    getApps: jest.fn(),
    getApp: jest.fn(),
    createApp: jest.fn(),
    updateApp: jest.fn(),
    deleteApp: jest.fn(),
    getAppsForPlayer: jest.fn(),
    addAppToPlayer: jest.fn(),
    removeAppFromPlayer: jest.fn(),
    orderApps: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppsController],
      providers: [
        {
          provide: AppsFacadeService,
          useValue: mockAppsFacadeService,
        },
      ],
    }).compile();

    controller = module.get<AppsController>(AppsController);
    facadeService = module.get<AppsFacadeService>(AppsFacadeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all apps', async () => {
      mockAppsFacadeService.getApps.mockResolvedValue(mockAppsData);

      const result = await controller.findAll();

      expect(result).toEqual(mockAppsData);
      expect(facadeService.getApps).toHaveBeenCalledTimes(1);
    });

    it('should handle empty apps list', async () => {
      mockAppsFacadeService.getApps.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(facadeService.getApps).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      mockAppsFacadeService.getApps.mockRejectedValue(new Error(errorMessage));

      await expect(controller.findAll()).rejects.toThrow(errorMessage);
      expect(facadeService.getApps).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    const createAppDto: CreateAppDto = {
      name: 'Test App',
      url: 'testapp',
      active: 1,
    };

    it('should create a new app', async () => {
      const expectedResult = { ...mockAppData, ...createAppDto, id: 3 };
      mockAppsFacadeService.createApp.mockResolvedValue(expectedResult);

      const result = await controller.create(createAppDto);

      expect(result).toEqual(expectedResult);
      expect(facadeService.createApp).toHaveBeenCalledWith(createAppDto);
      expect(facadeService.createApp).toHaveBeenCalledTimes(1);
    });

    it('should handle validation errors', async () => {
      const invalidDto = { name: '' } as CreateAppDto;
      mockAppsFacadeService.createApp.mockRejectedValue(
        new BadRequestException('Name is required'),
      );

      await expect(controller.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(facadeService.createApp).toHaveBeenCalledWith(invalidDto);
    });
  });

  describe('order', () => {
    const orderDto: OrderAppDto = {
      order: [
        { id: 1, order: 1 },
        { id: 2, order: 2 },
      ],
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    };

    it('should order apps successfully', async () => {
      const expectedResult: SuccessResponse = {
        success: true,
        message: 'Apps ordered successfully',
      };
      mockAppsFacadeService.orderApps.mockResolvedValue({ success: true });

      const result = await controller.order(orderDto);

      expect(result).toEqual(expectedResult);
      expect(facadeService.orderApps).toHaveBeenCalledWith(
        orderDto.order,
        orderDto.uuid,
      );
      expect(facadeService.orderApps).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid order data', async () => {
      const invalidOrderDto: OrderAppDto = {
        order: [],
        uuid: '',
      };
      mockAppsFacadeService.orderApps.mockRejectedValue(
        new BadRequestException('Invalid uuid or order data'),
      );

      await expect(controller.order(invalidOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(facadeService.orderApps).toHaveBeenCalledWith(
        invalidOrderDto.order,
        invalidOrderDto.uuid,
      );
    });
  });

  describe('getForPlayer', () => {
    const getPlayerAppsDto: GetPlayerAppsDto = {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    };

    it('should return apps for a player', async () => {
      mockAppsFacadeService.getAppsForPlayer.mockResolvedValue(
        mockPlayerAppsData,
      );

      const result = await controller.getForPlayer(getPlayerAppsDto);

      expect(result).toEqual(mockPlayerAppsData);
      expect(facadeService.getAppsForPlayer).toHaveBeenCalledWith(
        getPlayerAppsDto.uuid,
      );
      expect(facadeService.getAppsForPlayer).toHaveBeenCalledTimes(1);
    });

    it('should return empty array for non-existent player', async () => {
      const nonExistentDto: GetPlayerAppsDto = { uuid: 'non-existent-uuid' };
      mockAppsFacadeService.getAppsForPlayer.mockResolvedValue([]);

      const result = await controller.getForPlayer(nonExistentDto);

      expect(result).toEqual([]);
      expect(facadeService.getAppsForPlayer).toHaveBeenCalledWith(
        'non-existent-uuid',
      );
    });

    it('should handle empty uuid', async () => {
      const emptyDto: GetPlayerAppsDto = { uuid: '' };
      mockAppsFacadeService.getAppsForPlayer.mockResolvedValue([]);

      const result = await controller.getForPlayer(emptyDto);

      expect(result).toEqual([]);
      expect(facadeService.getAppsForPlayer).toHaveBeenCalledWith('');
    });
  });

  describe('addAppToPlayer', () => {
    const playerAppDto: PlayerAppDto = {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      id: 1,
    };

    it('should add app to player successfully', async () => {
      const expectedResult: SuccessResponse = {
        success: true,
        message: 'App added to player successfully',
      };
      mockAppsFacadeService.addAppToPlayer.mockResolvedValue(expectedResult);

      const result = await controller.addAppToPlayer(playerAppDto);

      expect(result).toEqual(expectedResult);
      expect(facadeService.addAppToPlayer).toHaveBeenCalledWith(
        playerAppDto.uuid,
        playerAppDto.id,
      );
      expect(facadeService.addAppToPlayer).toHaveBeenCalledTimes(1);
    });

    it('should handle app not found', async () => {
      mockAppsFacadeService.addAppToPlayer.mockRejectedValue(
        new NotFoundException('App not found or already active'),
      );

      await expect(controller.addAppToPlayer(playerAppDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(facadeService.addAppToPlayer).toHaveBeenCalledWith(
        playerAppDto.uuid,
        playerAppDto.id,
      );
    });

    it('should handle app already added', async () => {
      mockAppsFacadeService.addAppToPlayer.mockRejectedValue(
        new ConflictException('App already added to player'),
      );

      await expect(controller.addAppToPlayer(playerAppDto)).rejects.toThrow(
        ConflictException,
      );
      expect(facadeService.addAppToPlayer).toHaveBeenCalledWith(
        playerAppDto.uuid,
        playerAppDto.id,
      );
    });

    it('should handle invalid data', async () => {
      const invalidDto: PlayerAppDto = { uuid: '', id: 0 };
      mockAppsFacadeService.addAppToPlayer.mockRejectedValue(
        new BadRequestException('Invalid uuid or appId'),
      );

      await expect(controller.addAppToPlayer(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(facadeService.addAppToPlayer).toHaveBeenCalledWith(
        invalidDto.uuid,
        invalidDto.id,
      );
    });
  });

  describe('removeAppFromPlayer', () => {
    const playerAppDto: PlayerAppDto = {
      uuid: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
      id: 1,
    };

    it('should remove app from player successfully', async () => {
      const expectedResult: SuccessResponse = {
        success: true,
        message: 'App removed from player successfully',
      };
      mockAppsFacadeService.removeAppFromPlayer.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.removeAppFromPlayer(playerAppDto);

      expect(result).toEqual(expectedResult);
      expect(facadeService.removeAppFromPlayer).toHaveBeenCalledWith(
        playerAppDto.uuid,
        playerAppDto.id,
      );
      expect(facadeService.removeAppFromPlayer).toHaveBeenCalledTimes(1);
    });

    it('should handle app not found in player list', async () => {
      mockAppsFacadeService.removeAppFromPlayer.mockRejectedValue(
        new NotFoundException("App not found in player's list"),
      );

      await expect(
        controller.removeAppFromPlayer(playerAppDto),
      ).rejects.toThrow(NotFoundException);
      expect(facadeService.removeAppFromPlayer).toHaveBeenCalledWith(
        playerAppDto.uuid,
        playerAppDto.id,
      );
    });

    it('should handle invalid data', async () => {
      const invalidDto: PlayerAppDto = { uuid: '', id: 0 };
      mockAppsFacadeService.removeAppFromPlayer.mockRejectedValue(
        new BadRequestException('Invalid uuid or appId'),
      );

      await expect(controller.removeAppFromPlayer(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(facadeService.removeAppFromPlayer).toHaveBeenCalledWith(
        invalidDto.uuid,
        invalidDto.id,
      );
    });
  });

  describe('findOne', () => {
    it('should return app by id', async () => {
      mockAppsFacadeService.getApp.mockResolvedValue(mockAppData);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockAppData);
      expect(facadeService.getApp).toHaveBeenCalledWith(1);
      expect(facadeService.getApp).toHaveBeenCalledTimes(1);
    });

    it('should handle app not found', async () => {
      mockAppsFacadeService.getApp.mockRejectedValue(
        new NotFoundException('App with ID 999 not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(facadeService.getApp).toHaveBeenCalledWith(999);
    });

    it('should handle invalid id format', async () => {
      const invalidId = NaN;
      mockAppsFacadeService.getApp.mockRejectedValue(
        new BadRequestException('Invalid app ID'),
      );

      await expect(controller.findOne(invalidId)).rejects.toThrow(
        BadRequestException,
      );
      expect(facadeService.getApp).toHaveBeenCalledWith(invalidId);
    });
  });

  describe('update', () => {
    const updateAppDto: UpdateAppDto = {
      name: 'Updated App',
      url: 'updated-app',
    };

    it('should update app successfully', async () => {
      const expectedResult = { ...mockAppData, ...updateAppDto };
      mockAppsFacadeService.updateApp.mockResolvedValue(expectedResult);

      const result = await controller.update(1, updateAppDto);

      expect(result).toEqual(expectedResult);
      expect(facadeService.updateApp).toHaveBeenCalledWith(1, updateAppDto);
      expect(facadeService.updateApp).toHaveBeenCalledTimes(1);
    });

    it('should handle app not found', async () => {
      mockAppsFacadeService.updateApp.mockRejectedValue(
        new NotFoundException('App with ID 999 not found'),
      );

      await expect(controller.update(999, updateAppDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(facadeService.updateApp).toHaveBeenCalledWith(999, updateAppDto);
    });

    it('should handle partial update', async () => {
      const partialUpdate: UpdateAppDto = { name: 'New Name Only' };
      const expectedResult = { ...mockAppData, name: 'New Name Only' };
      mockAppsFacadeService.updateApp.mockResolvedValue(expectedResult);

      const result = await controller.update(1, partialUpdate);

      expect(result).toEqual(expectedResult);
      expect(facadeService.updateApp).toHaveBeenCalledWith(1, partialUpdate);
    });

    it('should handle empty update', async () => {
      const emptyUpdate: UpdateAppDto = {};
      mockAppsFacadeService.updateApp.mockResolvedValue(mockAppData);

      const result = await controller.update(1, emptyUpdate);

      expect(result).toEqual(mockAppData);
      expect(facadeService.updateApp).toHaveBeenCalledWith(1, emptyUpdate);
    });
  });

  describe('remove', () => {
    it('should delete app successfully', async () => {
      const expectedResult: SuccessResponse = {
        success: true,
        message: 'App deleted successfully',
      };
      mockAppsFacadeService.deleteApp.mockResolvedValue(expectedResult);

      const result = await controller.remove(1);

      expect(result).toEqual(expectedResult);
      expect(facadeService.deleteApp).toHaveBeenCalledWith(1);
      expect(facadeService.deleteApp).toHaveBeenCalledTimes(1);
    });

    it('should handle app not found', async () => {
      mockAppsFacadeService.deleteApp.mockRejectedValue(
        new NotFoundException('App with ID 999 not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
      expect(facadeService.deleteApp).toHaveBeenCalledWith(999);
    });

    it('should handle database constraint errors', async () => {
      mockAppsFacadeService.deleteApp.mockRejectedValue(
        new ConflictException('Cannot delete app with active users'),
      );

      await expect(controller.remove(1)).rejects.toThrow(ConflictException);
      expect(facadeService.deleteApp).toHaveBeenCalledWith(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      // Create app
      const createDto: CreateAppDto = {
        name: 'Test App',
        url: 'test',
        active: 1,
      };
      const createdApp = { ...mockAppData, ...createDto, id: 3 };
      mockAppsFacadeService.createApp.mockResolvedValue(createdApp);

      // Add to player
      const playerDto: PlayerAppDto = { uuid: 'test-uuid', id: 3 };
      const successResult: SuccessResponse = {
        success: true,
        message: 'App added to player successfully',
      };
      mockAppsFacadeService.addAppToPlayer.mockResolvedValue(successResult);

      // Update app
      const updateDto: UpdateAppDto = { name: 'Updated Test App' };
      const updatedApp = { ...createdApp, ...updateDto };
      mockAppsFacadeService.updateApp.mockResolvedValue(updatedApp);

      // Execute operations
      const createResult = await controller.create(createDto);
      const addResult = await controller.addAppToPlayer(playerDto);
      const updateResult = await controller.update(3, updateDto);

      // Verify results
      expect(createResult).toEqual(createdApp);
      expect(addResult).toEqual(successResult);
      expect(updateResult).toEqual(updatedApp);

      // Verify calls
      expect(facadeService.createApp).toHaveBeenCalledWith(createDto);
      expect(facadeService.addAppToPlayer).toHaveBeenCalledWith(
        playerDto.uuid,
        playerDto.id,
      );
      expect(facadeService.updateApp).toHaveBeenCalledWith(3, updateDto);
    });

    it('should handle concurrent operations', async () => {
      mockAppsFacadeService.getApps.mockResolvedValue(mockAppsData);
      mockAppsFacadeService.getApp.mockResolvedValue(mockAppData);

      const promises = [controller.findAll(), controller.findOne(1)];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockAppsData);
      expect(results[1]).toEqual(mockAppData);
      expect(facadeService.getApps).toHaveBeenCalledTimes(1);
      expect(facadeService.getApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors correctly', async () => {
      const customError = new Error('Custom service error');
      mockAppsFacadeService.getApps.mockRejectedValue(customError);

      await expect(controller.findAll()).rejects.toThrow(
        'Custom service error',
      );
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockAppsFacadeService.getAppsForPlayer.mockRejectedValue(timeoutError);

      await expect(controller.getForPlayer({ uuid: 'test' })).rejects.toThrow(
        'Request timeout',
      );
    });
  });
});
