import { Test, TestingModule } from '@nestjs/testing';
import { AppsFacadeService } from './apps.facade.service';
import { AppsService } from './services/apps.service';
import { UserAppsService } from './services/user-apps.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

describe('AppsFacadeService', () => {
  let service: AppsFacadeService;
  let appsService: AppsService;
  let userAppsService: UserAppsService;
  let mockDb: any;

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

  const mockDbTransaction = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsFacadeService,
        { provide: AppsService, useValue: mockAppsService },
        { provide: UserAppsService, useValue: mockUserAppsService },
        { provide: DRIZZLE, useValue: mockDbTransaction },
      ],
    }).compile();

    service = module.get<AppsFacadeService>(AppsFacadeService);
    appsService = module.get<AppsService>(AppsService);
    userAppsService = module.get<UserAppsService>(UserAppsService);
    mockDb = module.get(DRIZZLE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApps', () => {
    it('should return all apps', async () => {
      const mockApps = [{ id: 1, name: 'Test App' }];
      mockAppsService.getAllApps.mockResolvedValue(mockApps);

      const result = await service.getApps();

      expect(result).toEqual(mockApps);
      expect(appsService.getAllApps).toHaveBeenCalledTimes(1);
    });
  });

  describe('getApp', () => {
    it('should return app by id', async () => {
      const mockApp = { id: 1, name: 'Test App' };
      mockAppsService.getAppById.mockResolvedValue(mockApp);

      const result = await service.getApp(1);

      expect(result).toEqual(mockApp);
      expect(appsService.getAppById).toHaveBeenCalledWith(1);
    });
  });

  describe('createApp', () => {
    it('should create a new app', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'new-app' };
      const mockApp = { id: 1, ...createDto };
      mockAppsService.createApp.mockResolvedValue(mockApp);

      const result = await service.createApp(createDto);

      expect(result).toEqual(mockApp);
      expect(appsService.createApp).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateApp', () => {
    it('should update an app', async () => {
      const updateDto: UpdateAppDto = { name: 'Updated App' };
      const mockApp = { id: 1, name: 'Updated App' };
      mockAppsService.updateApp.mockResolvedValue(mockApp);

      const result = await service.updateApp(1, updateDto);

      expect(result).toEqual(mockApp);
      expect(appsService.updateApp).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('deleteApp', () => {
    it('should delete an app', async () => {
      const mockResult = { success: true };
      mockAppsService.deleteApp.mockResolvedValue(mockResult);

      const result = await service.deleteApp(1);

      expect(result).toEqual(mockResult);
      expect(appsService.deleteApp).toHaveBeenCalledWith(1);
    });
  });

  describe('getAppsForPlayer', () => {
    it('should return apps for player', async () => {
      const uuid = 'test-uuid';
      const mockApps = [{ id: 1, name: 'Player App' }];
      mockUserAppsService.getAppsForPlayer.mockResolvedValue(mockApps);

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
      mockUserAppsService.addAppToPlayer.mockResolvedValue(mockResult);

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
      mockUserAppsService.removeAppFromPlayer.mockResolvedValue(mockResult);

      const result = await service.removeAppFromPlayer(uuid, appId);

      expect(result).toEqual(mockResult);
      expect(userAppsService.removeAppFromPlayer).toHaveBeenCalledWith(
        uuid,
        appId,
      );
    });
  });

  describe('orderApps', () => {
    it('should order apps with transaction', async () => {
      const order = [{ id: 1, order: 1 }];
      const uuid = 'test-uuid';
      const mockResult = { success: true };

      mockDbTransaction.transaction.mockImplementation(async (callback) => {
        return callback();
      });
      mockUserAppsService.orderAppsForPlayer.mockResolvedValue(mockResult);

      const result = await service.orderApps(order, uuid);

      expect(mockDbTransaction.transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });
  });
});
