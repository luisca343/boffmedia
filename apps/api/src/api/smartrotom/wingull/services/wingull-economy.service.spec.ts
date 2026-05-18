import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { WingullEconomyService } from './wingull-economy.service';
import { WINGULL_ECONOMY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  updateBalanceInAPI: jest.fn(),
  getCurrentBalanceFromAPI: jest.fn(),
  getMoneyFromAPI: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

describe('WingullEconomyService', () => {
  let service: WingullEconomyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullEconomyService,
        { provide: Logger, useValue: mockLogger },
        { provide: WINGULL_ECONOMY_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WingullEconomyService>(WingullEconomyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── updateBalance ────────────────────────────────────────────────────────────

  describe('updateBalance()', () => {
    const dto = { uuid: 'abc-123', amount: 100 } as any;

    it('delegates to repo and returns result', async () => {
      mockRepo.updateBalanceInAPI.mockResolvedValue({ success: true });

      await expect(service.updateBalance(dto)).resolves.toEqual({ success: true });
      expect(mockRepo.updateBalanceInAPI).toHaveBeenCalledWith(dto);
    });

    it('wraps repo error and re-throws', async () => {
      mockRepo.updateBalanceInAPI.mockRejectedValue(new Error('API down'));

      await expect(service.updateBalance(dto)).rejects.toThrow(
        'Balance update failed: API down',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── getCurrentBalance ────────────────────────────────────────────────────────

  describe('getCurrentBalance()', () => {
    it('returns balance from repo', async () => {
      mockRepo.getCurrentBalanceFromAPI.mockResolvedValue(500);

      await expect(service.getCurrentBalance('abc-123')).resolves.toBe(500);
    });

    it('returns 0 when repo returns null', async () => {
      mockRepo.getCurrentBalanceFromAPI.mockResolvedValue(null);

      await expect(service.getCurrentBalance('abc-123')).resolves.toBe(0);
    });

    it('wraps repo error and re-throws', async () => {
      mockRepo.getCurrentBalanceFromAPI.mockRejectedValue(new Error('timeout'));

      await expect(service.getCurrentBalance('abc-123')).rejects.toThrow(
        'Current balance retrieval failed: timeout',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── getMoney ─────────────────────────────────────────────────────────────────

  describe('getMoney()', () => {
    it('returns money field from repo result', async () => {
      mockRepo.getMoneyFromAPI.mockResolvedValue({ money: 1000 });

      await expect(service.getMoney('abc-123')).resolves.toBe(1000);
    });

    it('returns 0 when result.money is falsy', async () => {
      mockRepo.getMoneyFromAPI.mockResolvedValue({ money: 0 });

      await expect(service.getMoney('abc-123')).resolves.toBe(0);
    });

    it('wraps repo error and re-throws', async () => {
      mockRepo.getMoneyFromAPI.mockRejectedValue(new Error('network error'));

      await expect(service.getMoney('abc-123')).rejects.toThrow(
        'Money retrieval failed: network error',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
