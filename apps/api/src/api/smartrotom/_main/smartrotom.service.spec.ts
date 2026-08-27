import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SmartrotomService } from './smartrotom.service';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { ArceuspeakRepository } from './repositories/arceuspeak.repository';

const mockRepository = {
  findAll: jest.fn(),
  insert: jest.fn(),
};

const mockStarbank = {
  getMainAccount: jest.fn(),
  transferFromSystem: jest.fn(),
};
const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('SmartrotomService', () => {
  let service: SmartrotomService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartrotomService,
        { provide: Logger, useValue: mockLogger },
        { provide: ArceuspeakRepository, useValue: mockRepository },
        { provide: StarbankFacadeService, useValue: mockStarbank },
      ],
    }).compile();

    service = module.get<SmartrotomService>(SmartrotomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArceuspeak()', () => {
    it('returns the stored arceuspeak rows', async () => {
      const rows = [{ name: 'pikachu', value: 'Pika!', format: 'text' }];
      mockRepository.findAll.mockResolvedValue(rows);

      const result = await service.getArceuspeak();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(rows);
    });
  });

  describe('createOrUpdateArceuspeak()', () => {
    it('inserts a new arceuspeak record', async () => {
      mockRepository.insert.mockResolvedValue(undefined);

      await service.createOrUpdateArceuspeak('pikachu', 'Pika Pika!', 'text');

      expect(mockRepository.insert).toHaveBeenCalledWith(
        'pikachu',
        'Pika Pika!',
        'text',
      );
    });
  });
});
