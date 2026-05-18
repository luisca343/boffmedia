import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EnergyService } from './energy.service';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const UUID = 'abc-123-uuid';

const mockRepo = {
  findPlayerEnergy: jest.fn(),
  findPlayerLastCharge: jest.fn(),
  updatePlayerEnergy: jest.fn(),
};

describe('EnergyService', () => {
  let service: EnergyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Fix "now" to a known point in time
    jest.setSystemTime(new Date('2026-01-01T10:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyService,
        { provide: MINE_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<EnergyService>(EnergyService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPlayerEnergy ──────────────────────────────────────────────────────────

  describe('getPlayerEnergy()', () => {
    it('returns MAX_ENERGY immediately when player is already at 10', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 10 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T09:00:00.000Z'));

      const result = await service.getPlayerEnergy(UUID);

      expect(result.energy).toBe(10);
      expect(result.maxEnergy).toBe(10);
      expect(result.timeToNextCharge).toBe(0);
      expect(mockRepo.updatePlayerEnergy).not.toHaveBeenCalled();
    });

    it('regenerates energy from elapsed hours and updates repo', async () => {
      // lastCharge 2.5 hours ago → extraEnergy = 2
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 3 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T07:30:00.000Z'));
      mockRepo.updatePlayerEnergy.mockResolvedValue(undefined);

      const result = await service.getPlayerEnergy(UUID);

      expect(result.energy).toBe(5); // 3 + 2
      expect(mockRepo.updatePlayerEnergy).toHaveBeenCalledWith(
        UUID,
        5,
        // newLastCharge = 07:30 + 2h = 09:30
        new Date('2026-01-01T09:30:00.000Z'),
      );
    });

    it('caps regen at MAX_ENERGY (10)', async () => {
      // lastCharge 8 hours ago, player has 5 energy → would regen 8 → capped at 10
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 5 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T02:00:00.000Z'));
      mockRepo.updatePlayerEnergy.mockResolvedValue(undefined);

      const result = await service.getPlayerEnergy(UUID);

      expect(result.energy).toBe(10);
    });

    it('does not call updatePlayerEnergy when no regen has occurred', async () => {
      // lastCharge 30 minutes ago → extraEnergy = 0
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 5 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T09:30:00.000Z'));

      await service.getPlayerEnergy(UUID);

      expect(mockRepo.updatePlayerEnergy).not.toHaveBeenCalled();
    });

    it('calculates timeToNextCharge correctly (30 min elapsed within 1h cycle)', async () => {
      // 2.5h elapsed: extraEnergy=2, remainder = 0.5h = 1800000ms
      // timeToNextCharge = 3600000 - 1800000 = 1800000
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 3 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T07:30:00.000Z'));
      mockRepo.updatePlayerEnergy.mockResolvedValue(undefined);

      const result = await service.getPlayerEnergy(UUID);

      expect(result.timeToNextCharge).toBe(1800000);
    });

    it('sets timeToNextCharge=0 when energy reaches MAX_ENERGY after regen', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 5 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(new Date('2026-01-01T02:00:00.000Z'));
      mockRepo.updatePlayerEnergy.mockResolvedValue(undefined);

      const result = await service.getPlayerEnergy(UUID);

      expect(result.timeToNextCharge).toBe(0);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getPlayerEnergy('')).rejects.toThrow(BadRequestException);
      expect(mockRepo.findPlayerEnergy).not.toHaveBeenCalled();
    });

    it('throws when player energy record not found', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue(null);

      await expect(service.getPlayerEnergy(UUID)).rejects.toThrow('Player not found');
    });

    it('throws when player last charge record not found', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 5 });
      mockRepo.findPlayerLastCharge.mockResolvedValue(null);

      await expect(service.getPlayerEnergy(UUID)).rejects.toThrow(
        'Player energy data not found',
      );
    });
  });

  // ─── consumeEnergy ────────────────────────────────────────────────────────────

  describe('consumeEnergy()', () => {
    const mockStatus = {
      energy: 5,
      maxEnergy: 10,
      lastCharge: new Date('2026-01-01T09:30:00.000Z'),
      timeToNextCharge: 1800000,
    };

    beforeEach(() => {
      jest.spyOn(service, 'getPlayerEnergy').mockResolvedValue(mockStatus);
      mockRepo.updatePlayerEnergy.mockResolvedValue(undefined);
    });

    it('deducts the specified amount and updates repo', async () => {
      const result = await service.consumeEnergy(UUID, 2);

      expect(result.energy).toBe(3);
      expect(mockRepo.updatePlayerEnergy).toHaveBeenCalledWith(UUID, 3);
    });

    it('deducts 1 by default', async () => {
      const result = await service.consumeEnergy(UUID);

      expect(result.energy).toBe(4);
      expect(mockRepo.updatePlayerEnergy).toHaveBeenCalledWith(UUID, 4);
    });

    it('throws BadRequestException when energy is insufficient', async () => {
      jest.spyOn(service, 'getPlayerEnergy').mockResolvedValue({ ...mockStatus, energy: 1 });

      await expect(service.consumeEnergy(UUID, 3)).rejects.toThrow('Not enough energy');
      expect(mockRepo.updatePlayerEnergy).not.toHaveBeenCalled();
    });
  });

  // ─── validateEnergyForPlay ────────────────────────────────────────────────────

  describe('validateEnergyForPlay()', () => {
    it('returns true when player has at least 1 energy', async () => {
      jest.spyOn(service, 'getPlayerEnergy').mockResolvedValue({
        energy: 3, maxEnergy: 10, lastCharge: new Date(), timeToNextCharge: 0,
      });

      await expect(service.validateEnergyForPlay(UUID)).resolves.toBe(true);
    });

    it('returns false when player has 0 energy', async () => {
      jest.spyOn(service, 'getPlayerEnergy').mockResolvedValue({
        energy: 0, maxEnergy: 10, lastCharge: new Date(), timeToNextCharge: 3600000,
      });

      await expect(service.validateEnergyForPlay(UUID)).resolves.toBe(false);
    });
  });
});
