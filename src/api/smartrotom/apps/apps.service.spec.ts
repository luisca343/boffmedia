import { Test, TestingModule } from '@nestjs/testing';
import { AppsService } from './apps.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

describe('AppsService', () => {
  let service: AppsService;
  let mockDb: jest.Mocked<any>;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      execute: jest.fn(),
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppsService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AppsService>(AppsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return apps and total count', async () => {
      const mockApps = [{ id: 1, name: 'Test App' }];
      const mockCount = [{ count: BigInt(1) }];
      
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockApps).mockResolvedValueOnce(mockCount),
      });

      const result = await service.findAll();
      expect(result).toEqual({ apps: mockApps, total: 1 });
    });

    it('should throw an error if database query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('create', () => {
    it('should create a new app', async () => {
      const createAppDto: CreateAppDto = { name: 'New App', url: 'http://example.com' };
      const mockInsertResult = [{ insertId: 1 }];
      const mockCreatedApp = { id: 1, ...createAppDto };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(mockInsertResult),
      });
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockCreatedApp]),
      }));

      const result = await service.create(createAppDto);
      expect(result).toEqual(mockCreatedApp);
    });

    it('should throw an error if app creation fails', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Insert error');
      });

      await expect(service.create({} as CreateAppDto)).rejects.toThrow(HttpException);
    });
  });

  describe('order', () => {
    it('should order apps successfully', async () => {
      const orderData = [{ id: 1, order: 1 }, { id: 2, order: 2 }];
      const uuid = 'test-uuid';

      mockDb.transaction.mockImplementation((callback) => callback(mockDb));
      mockDb.delete.mockReturnValue({ where: jest.fn().mockResolvedValue(null) });
      mockDb.insert.mockReturnValue({ values: jest.fn().mockResolvedValue(null) });

      const result = await service.order(orderData, uuid);
      expect(result).toEqual({ success: true });
    });

    it('should throw an error if ordering fails', async () => {
      mockDb.transaction.mockImplementation(() => {
        throw new Error('Transaction error');
      });

      await expect(service.order([], 'test-uuid')).rejects.toThrow(HttpException);
    });
  });

  describe('getForPlayer', () => {
    it('should return apps for a player', async () => {
      const mockApps = [{ id: 1, name: 'Test App', url: 'http://example.com', orden: 1 }];
      mockDb.execute.mockResolvedValue([mockApps]);

      const result = await service.getForPlayer('test-uuid');
      expect(result).toEqual(mockApps);
    });

    it('should return an empty array if uuid is not provided', async () => {
      const result = await service.getForPlayer('');
      expect(result).toEqual([]);
    });

    it('should throw an error if query fails', async () => {
      mockDb.execute.mockRejectedValue(new Error('Query error'));

      await expect(service.getForPlayer('test-uuid')).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return an app by id', async () => {
      const mockApp = { id: 1, name: 'Test App', url: 'http://example.com' };
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockApp]),
      }));

      const result = await service.findOne(1);
      expect(result).toEqual(mockApp);
    });

    it('should return null if app is not found', async () => {
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }));

      const result = await service.findOne(1);
      expect(result).toBeNull();
    });

    it('should throw an error if query fails', async () => {
      mockDb.select.mockImplementation(() => {
        throw new Error('Query error');
      });

      await expect(service.findOne(1)).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update an app', async () => {
      const updateAppDto: UpdateAppDto = { name: 'Updated App' };
      const mockUpdatedApp = { id: 1, ...updateAppDto };

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(null),
      });
      mockDb.select.mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUpdatedApp]),
      }));

      const result = await service.update(1, updateAppDto);
      expect(result).toEqual(mockUpdatedApp);
    });

    it('should throw an error if update fails', async () => {
      mockDb.update.mockImplementation(() => {
        throw new Error('Update error');
      });

      await expect(service.update(1, {} as UpdateAppDto)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should remove an app', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
      });

      const result = await service.remove(1);
      expect(result).toEqual({ success: true });
    });

    it('should throw a not found error if app does not exist', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
      });

      await expect(service.remove(1)).rejects.toThrow(HttpException);
      await expect(service.remove(1)).rejects.toThrow('App not found');
    });

    it('should throw an error if delete fails', async () => {
      mockDb.delete.mockImplementation(() => {
        throw new Error('Delete error');
      });

      await expect(service.remove(1)).rejects.toThrow(HttpException);
    });
  });
});
