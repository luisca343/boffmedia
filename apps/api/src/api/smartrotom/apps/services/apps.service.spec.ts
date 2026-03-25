import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AppsService } from './apps.service';
import { AppsRepository } from '@api/smartrotom/apps/repositories/apps.repository';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';

describe('AppsService', () => {
  let service: AppsService;
  let repository: AppsRepository;

  const mockAppsRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findActiveApp: jest.fn(),
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
        { provide: AppsRepository, useValue: mockAppsRepository },
      ],
    }).compile();

    service = module.get<AppsService>(AppsService);
    repository = module.get<AppsRepository>(AppsRepository);
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
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAppById', () => {
    it('should return app by id', async () => {
      mockAppsRepository.findById.mockResolvedValue(mockApp);

      const result = await service.getAppById(1);

      expect(result).toEqual(mockApp);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.findById.mockResolvedValue(null);

      await expect(service.getAppById(999)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('createApp', () => {
    it('should create and return new app', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'new-app' };
      mockAppsRepository.create.mockResolvedValue({ insertId: 1 });
      mockAppsRepository.findById.mockResolvedValue({ ...mockApp, ...createDto });

      const result = await service.createApp(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result.name).toBe(createDto.name);
    });
  });

  describe('updateApp', () => {
    it('should update and return app', async () => {
      const updateDto: UpdateAppDto = { name: 'Updated App' };
      mockAppsRepository.findById
        .mockResolvedValueOnce(mockApp)
        .mockResolvedValueOnce({ ...mockApp, ...updateDto });

      const result = await service.updateApp(1, updateDto);

      expect(repository.findById).toHaveBeenCalledTimes(2);
      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.findById.mockResolvedValue(null);

      await expect(service.updateApp(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteApp', () => {
    it('should delete app successfully', async () => {
      mockAppsRepository.delete.mockResolvedValue({ affectedRows: 1 });

      const result = await service.deleteApp(1);

      expect(result).toEqual({ success: true });
      expect(repository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      mockAppsRepository.delete.mockResolvedValue({ affectedRows: 0 });

      await expect(service.deleteApp(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateAppExists', () => {
    it('should return true when app exists', async () => {
      mockAppsRepository.findById.mockResolvedValue(mockApp);

      const result = await service.validateAppExists(1);

      expect(result).toBe(true);
    });

    it('should return false when app does not exist', async () => {
      mockAppsRepository.findById.mockResolvedValue(null);

      const result = await service.validateAppExists(999);

      expect(result).toBe(false);
    });
  });

  describe('validateActiveApp', () => {
    it('should return true when active app exists', async () => {
      mockAppsRepository.findActiveApp.mockResolvedValue(mockApp);

      const result = await service.validateActiveApp(1);

      expect(result).toBe(true);
    });

    it('should return false when active app does not exist', async () => {
      mockAppsRepository.findActiveApp.mockResolvedValue(null);

      const result = await service.validateActiveApp(999);

      expect(result).toBe(false);
    });
  });
});