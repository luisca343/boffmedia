import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AppsService } from './apps.service';
import { APPS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';

describe('AppsService', () => {
  let service: AppsService;

  const mockAppsRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    findByUrl: jest.fn(),
    findActiveApps: jest.fn(),
    findByActive: jest.fn(),
  };

  const mockApp = {
    id: 1,
    name: 'Test App',
    url: 'test-app',
    active: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsService,
        { provide: APPS_REPOSITORY_TOKEN, useValue: mockAppsRepository },
      ],
    }).compile();

    service = module.get<AppsService>(AppsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllApps', () => {
    it('should return all apps', async () => {
      const mockApps = [mockApp];
      mockAppsRepository.findAll.mockResolvedValue(mockApps);

      const result = await service.getAllApps();

      expect(result).toEqual(mockApps);
      expect(mockAppsRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAppById', () => {
    it('should return app by id', async () => {
      mockAppsRepository.findById.mockResolvedValue(mockApp);

      const result = await service.getAppById(1);

      expect(result).toEqual(mockApp);
      expect(mockAppsRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.findById.mockResolvedValue(null);

      await expect(service.getAppById(999)).rejects.toThrow(NotFoundException);
      expect(mockAppsRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('createApp', () => {
    it('should create and return new app', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'new-app' };
      const createdApp = { ...mockApp, ...createDto };
      mockAppsRepository.findByUrl.mockResolvedValue(null);
      mockAppsRepository.create.mockResolvedValue(createdApp);

      const result = await service.createApp(createDto);

      expect(mockAppsRepository.findByUrl).toHaveBeenCalledWith(createDto.url);
      expect(mockAppsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe(createDto.name);
    });

    it('should throw ConflictException when URL already exists', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'test-app' };
      mockAppsRepository.findByUrl.mockResolvedValue(mockApp);

      await expect(service.createApp(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAppsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateApp', () => {
    it('should update and return app', async () => {
      const updateDto: UpdateAppDto = { name: 'Updated App' };
      const updatedApp = { ...mockApp, ...updateDto };
      mockAppsRepository.findById.mockResolvedValue(mockApp);
      mockAppsRepository.update.mockResolvedValue(updatedApp);

      const result = await service.updateApp(1, updateDto);

      expect(mockAppsRepository.findById).toHaveBeenCalledWith(1);
      expect(mockAppsRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.findById.mockResolvedValue(null);

      await expect(service.updateApp(999, {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteApp', () => {
    it('should delete app successfully', async () => {
      mockAppsRepository.exists.mockResolvedValue(true);
      mockAppsRepository.delete.mockResolvedValue(true);

      const result = await service.deleteApp(1);

      expect(result).toEqual({ success: true });
      expect(mockAppsRepository.exists).toHaveBeenCalledWith(1);
      expect(mockAppsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.exists.mockResolvedValue(false);

      await expect(service.deleteApp(999)).rejects.toThrow(NotFoundException);
      expect(mockAppsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
