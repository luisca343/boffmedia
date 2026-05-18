import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SmartrotomService } from './smartrotom.service';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

const mockSelect = { from: jest.fn().mockReturnThis(), execute: jest.fn() };
const mockInsert = { values: jest.fn().mockReturnThis(), execute: jest.fn() };
const mockDb = {
  select: jest.fn().mockReturnValue(mockSelect),
  insert: jest.fn().mockReturnValue(mockInsert),
};

const mockStarbank = { getMainAccount: jest.fn(), transferFromSystem: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('SmartrotomService', () => {
  let service: SmartrotomService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue(mockSelect);
    mockDb.insert.mockReturnValue(mockInsert);
    mockSelect.from.mockReturnThis();
    mockInsert.values.mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartrotomService,
        { provide: Logger, useValue: mockLogger },
        { provide: DRIZZLE, useValue: mockDb },
        { provide: StarbankFacadeService, useValue: mockStarbank },
      ],
    }).compile();

    service = module.get<SmartrotomService>(SmartrotomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processRaceResult()', () => {
    it('logs the result', async () => {
      await service.processRaceResult({ time: 120, winner: 'Ash' });

      expect(mockLogger.log).toHaveBeenCalledWith({ time: 120, winner: 'Ash' });
    });
  });

  describe('getArceuspeak()', () => {
    it('queries the arceuspeak table', async () => {
      const rows = [{ name: 'pikachu', value: 'Pika!', format: 'text' }];
      mockSelect.execute.mockResolvedValue(rows);

      const result = await service.getArceuspeak();

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(rows);
    });
  });

  describe('createOrUpdateArceuspeak()', () => {
    it('inserts a new arceuspeak record', async () => {
      mockInsert.execute.mockResolvedValue({ insertId: 1 });

      await service.createOrUpdateArceuspeak('pikachu', 'Pika Pika!', 'text');

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith({
        name: 'pikachu',
        value: 'Pika Pika!',
        format: 'text',
      });
    });
  });
});
