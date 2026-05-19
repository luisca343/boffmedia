import { Test, TestingModule } from '@nestjs/testing';
import { AppsFacadeService } from './apps.facade.service';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

describe('AppsFacadeService', () => {
  let service: AppsFacadeService;
  let appsService: jest.Mocked<
    Pick<
      AppsService,
      'getAllApps' | 'getAppById' | 'createApp' | 'updateApp' | 'deleteApp'
    >
  >;
  let userAppsService: jest.Mocked<
    Pick<
      UserAppsService,
      | 'getAppsForPlayer'
      | 'addAppToPlayer'
      | 'removeAppFromPlayer'
      | 'orderAppsForPlayer'
    >
  >;

  beforeEach(async () => {
    const mockAppsService = {
      getAllApps: jest.fn(),
      getAppById: jest.fn(),
      createApp: jest.fn(),
      updateApp: jest.fn(),
      deleteApp: jest.fn(),
    };

    const mockUserAppsService = {
      getAppsForPlayer: jest.fn(),
      addAppToPlayer: jest.fn(),
      removeAppFromPlayer: jest.fn(),
      orderAppsForPlayer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsFacadeService,
        { provide: AppsService, useValue: mockAppsService },
        { provide: UserAppsService, useValue: mockUserAppsService },
      ],
    }).compile();

    service = module.get<AppsFacadeService>(AppsFacadeService);
    appsService = module.get(AppsService);
    userAppsService = module.get(UserAppsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApps', () => {
    it('should return all apps', async () => {
      const mockApps = [{ id: 1, name: 'Test App' }];
      appsService.getAllApps.mockResolvedValue(mockApps as any);

      const result = await service.getApps();

      expect(result).toEqual(mockApps);
      expect(appsService.getAllApps).toHaveBeenCalledTimes(1);
    });
  });

  describe('getApp', () => {
    it('should return app by id', async () => {
      const mockApp = { id: 1, name: 'Test App' };
      appsService.getAppById.mockResolvedValue(mockApp as any);

      const result = await service.getApp(1);

      expect(result).toEqual(mockApp);
      expect(appsService.getAppById).toHaveBeenCalledWith(1);
    });
  });

  describe('createApp', () => {
    it('should create a new app', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'new-app' };
      const mockApp = { id: 1, ...createDto };
      appsService.createApp.mockResolvedValue(mockApp as any);

      const result = await service.createApp(createDto);

      expect(result).toEqual(mockApp);
      expect(appsService.createApp).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateApp', () => {
    it('should update an app', async () => {
      const updateDto: UpdateAppDto = { name: 'Updated App' };
      const mockApp = { id: 1, name: 'Updated App' };
      appsService.updateApp.mockResolvedValue(mockApp as any);

      const result = await service.updateApp(1, updateDto);

      expect(result).toEqual(mockApp);
      expect(appsService.updateApp).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteApp', () => {
    it('should delete an app', async () => {
      const mockResult = { success: true };
      appsService.deleteApp.mockResolvedValue(mockResult as any);

      const result = await service.deleteApp(1);

      expect(result).toEqual(mockResult);
      expect(appsService.deleteApp).toHaveBeenCalledWith(1);
    });
  });

  describe('getAppsForPlayer', () => {
    it('should return apps for player', async () => {
      const uuid = 'test-uuid';
      const mockApps = [{ id: 1, name: 'Player App' }];
      userAppsService.getAppsForPlayer.mockResolvedValue(mockApps as any);

      const result = await service.getAppsForPlayer(uuid);

      expect(result).toEqual(mockApps);
      expect(userAppsService.getAppsForPlayer).toHaveBeenCalledWith(uuid);
    });
  });

  describe('addAppToPlayer', () => {
    it('should add app to player', async () => {
      const uuid = 'test-uuid';
      const appId = 1;
      const mockResult = { success: true };
      userAppsService.addAppToPlayer.mockResolvedValue(mockResult as any);

      const result = await service.addAppToPlayer(uuid, appId);

      expect(result).toEqual(mockResult);
      expect(userAppsService.addAppToPlayer).toHaveBeenCalledWith(uuid, appId);
    });
  });

  describe('removeAppFromPlayer', () => {
    it('should remove app from player', async () => {
      const uuid = 'test-uuid';
      const appId = 1;
      const mockResult = { success: true };
      userAppsService.removeAppFromPlayer.mockResolvedValue(mockResult as any);

      const result = await service.removeAppFromPlayer(uuid, appId);

      expect(result).toEqual(mockResult);
      expect(userAppsService.removeAppFromPlayer).toHaveBeenCalledWith(
        uuid,
        appId,
      );
    });
  });

  describe('orderApps', () => {
    it('should delegate order to userAppsService', async () => {
      const order = [{ id: 1, order: 1 }];
      const uuid = 'test-uuid';
      const mockResult = { success: true };
      userAppsService.orderAppsForPlayer.mockResolvedValue(mockResult as any);

      const result = await service.orderApps(order, uuid);

      expect(userAppsService.orderAppsForPlayer).toHaveBeenCalledWith(
        order,
        uuid,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
