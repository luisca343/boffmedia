import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AppsService } from './apps.service';
import { APPS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { CreateAppDto } from '../dto/create-app.dto';
import { UpdateAppDto } from '../dto/update-app.dto';

const mockApp = {
  id: 1,
  name: 'Test App',
  url: 'test-app',
  active: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AppsService', () => {
  let service: AppsService;
  let appsRepository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    findByUrl: jest.Mock;
    findActiveApps: jest.Mock;
    findByActive: jest.Mock;
  };

  beforeEach(async () => {
    appsRepository = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsService,
        { provide: APPS_REPOSITORY_TOKEN, useValue: appsRepository },
      ],
    }).compile();

    service = module.get<AppsService>(AppsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllApps', () => {
    it('should return all apps', async () => {
      appsRepository.findAll.mockResolvedValue([mockApp]);

      const result = await service.getAllApps();

      expect(result).toEqual([mockApp]);
      expect(appsRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAppById', () => {
    it('should return app by id', async () => {
      appsRepository.findById.mockResolvedValue(mockApp);

      const result = await service.getAppById(1);

      expect(result).toEqual(mockApp);
      expect(appsRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      appsRepository.findById.mockResolvedValue(null);

      await expect(service.getAppById(999)).rejects.toThrow(NotFoundException);
      expect(appsRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('createApp', () => {
    it('should create and return new app', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'new-app' };
      const createdApp = { ...mockApp, ...createDto };
      appsRepository.findByUrl.mockResolvedValue(null);
      appsRepository.create.mockResolvedValue(createdApp);

      const result = await service.createApp(createDto);

      expect(appsRepository.findByUrl).toHaveBeenCalledWith(createDto.url);
      expect(appsRepository.create).toHaveBeenCalledWith(createDto);
      expect(result.name).toBe(createDto.name);
    });

    it('should throw ConflictException when URL already exists', async () => {
      const createDto: CreateAppDto = { name: 'New App', url: 'test-app' };
      appsRepository.findByUrl.mockResolvedValue(mockApp);

      await expect(service.createApp(createDto)).rejects.toThrow(ConflictException);
      expect(appsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateApp', () => {
    it('should update and return app', async () => {
      const updateDto: UpdateAppDto = { name: 'Updated App' };
      const updatedApp = { ...mockApp, ...updateDto };
      appsRepository.findById.mockResolvedValue(mockApp);
      appsRepository.update.mockResolvedValue(updatedApp);

      const result = await service.updateApp(1, updateDto);

      expect(appsRepository.findById).toHaveBeenCalledWith(1);
      expect(appsRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException when app not found', async () => {
      appsRepository.findById.mockResolvedValue(null);

      await expect(service.updateApp(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteApp', () => {
    it('should delete app successfully', async () => {
      appsRepository.exists.mockResolvedValue(true);
      appsRepository.delete.mockResolvedValue(true);

      const result = await service.deleteApp(1);

      expect(result).toEqual({ success: true });
      expect(appsRepository.exists).toHaveBeenCalledWith(1);
      expect(appsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when app not found', async () => {
      appsRepository.exists.mockResolvedValue(false);

      await expect(service.deleteApp(999)).rejects.toThrow(NotFoundException);
      expect(appsRepository.delete).not.toHaveBeenCalled();
    });
  });
});
