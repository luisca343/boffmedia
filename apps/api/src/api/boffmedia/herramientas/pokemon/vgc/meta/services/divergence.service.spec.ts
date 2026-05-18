import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DivergenceService } from './divergence.service';
import { SmogonService } from './smogon.service';
import { LimitlessService } from './limitless.service';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { SMOGON_DEFAULT_CUTOFF } from '../config/smogon.config';

jest.mock('../utils/dex-resolver', () => ({
  getDexForFormat: jest.fn().mockReturnValue({
    species: { get: jest.fn().mockReturnValue({ name: null }) },
  }),
  toBaseFormId: jest.fn().mockImplementation((id: string) => id),
}));

const mockSmogonService = {
  getAvailableSnapshots: jest.fn(),
  getUsageEntries: jest.fn(),
};

const mockLimitlessService = {
  getUsageEntries: jest.fn(),
  getCombinedUsageEntries: jest.fn(),
};

const mockRegulationsRepository = {
  findById: jest.fn(),
};

const makeRegulation = (overrides: Partial<any> = {}) => ({
  id: 'regulation-h',
  formatId: 'gen9vgc2024regh',
  name: 'Regulation H',
  ...overrides,
});

const makeSnapshot = (overrides: Partial<any> = {}) => ({
  formatId: 'gen9vgc2024regh',
  month: '2024-11',
  cutoff: SMOGON_DEFAULT_CUTOFF,
  ...overrides,
});

const makeEntry = (speciesId: string, usagePercent: number): any => ({
  speciesId,
  speciesName: speciesId,
  usagePercent,
  rawCount: Math.round(usagePercent * 10),
  rank: 1,
});

describe('DivergenceService', () => {
  let service: DivergenceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRegulationsRepository.findById.mockResolvedValue(makeRegulation());
    mockSmogonService.getAvailableSnapshots.mockResolvedValue([makeSnapshot()]);
    mockSmogonService.getUsageEntries.mockResolvedValue([]);
    mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([]);
    mockLimitlessService.getUsageEntries.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DivergenceService,
        { provide: SmogonService, useValue: mockSmogonService },
        { provide: LimitlessService, useValue: mockLimitlessService },
        { provide: VgcRegulationsRepository, useValue: mockRegulationsRepository },
      ],
    }).compile();

    service = module.get<DivergenceService>(DivergenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── compareLadderVsTournament ────────────────────────────────────────────────

  describe('compareLadderVsTournament()', () => {
    it('throws NotFoundException when regulation is not found', async () => {
      mockRegulationsRepository.findById.mockResolvedValue(null);

      await expect(
        service.compareLadderVsTournament({ regulationId: 'bad-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when no snapshot matches the regulation format', async () => {
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([
        makeSnapshot({ formatId: 'different-format' }),
      ]);

      await expect(
        service.compareLadderVsTournament({ regulationId: 'regulation-h' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('uses the most recent snapshot month when month is not provided', async () => {
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([
        makeSnapshot({ month: '2024-09' }),
        makeSnapshot({ month: '2024-11' }),
        makeSnapshot({ month: '2024-10' }),
      ]);

      await service.compareLadderVsTournament({ regulationId: 'regulation-h' });

      expect(mockSmogonService.getUsageEntries).toHaveBeenCalledWith(
        'gen9vgc2024regh',
        '2024-11',
        SMOGON_DEFAULT_CUTOFF,
      );
    });

    it('uses the provided month without fetching snapshots', async () => {
      await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-08',
      });

      expect(mockSmogonService.getAvailableSnapshots).not.toHaveBeenCalled();
      expect(mockSmogonService.getUsageEntries).toHaveBeenCalledWith(
        'gen9vgc2024regh',
        '2024-08',
        SMOGON_DEFAULT_CUTOFF,
      );
    });

    it('uses the provided cutoff instead of the default', async () => {
      await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
        cutoff: 1000,
      });

      expect(mockSmogonService.getUsageEntries).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        1000,
      );
    });

    it('uses getCombinedUsageEntries when no tournamentId is provided', async () => {
      await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      expect(mockLimitlessService.getCombinedUsageEntries).toHaveBeenCalledWith('regulation-h');
      expect(mockLimitlessService.getUsageEntries).not.toHaveBeenCalled();
    });

    it('uses getUsageEntries(tournamentId) when tournamentId is provided', async () => {
      await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
        tournamentId: 42,
      });

      expect(mockLimitlessService.getUsageEntries).toHaveBeenCalledWith(42);
      expect(mockLimitlessService.getCombinedUsageEntries).not.toHaveBeenCalled();
    });

    it('returns a DivergenceResult with correct metadata', async () => {
      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      expect(result.regulationId).toBe('regulation-h');
      expect(result.tournamentId).toBeNull();
      expect(result.ladderFormat).toBe('gen9vgc2024regh');
      expect(result.ladderMonth).toBe('2024-11');
      expect(result.ladderCutoff).toBe(SMOGON_DEFAULT_CUTOFF);
    });

    it('sets tournamentId in result when provided', async () => {
      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
        tournamentId: 42,
      });

      expect(result.tournamentId).toBe(42);
    });

    it('computes delta as ladderPercent minus tournamentPercent', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([makeEntry('garchomp', 30)]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([makeEntry('garchomp', 20)]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      const row = result.rows.find((r) => r.speciesId === 'garchomp')!;
      expect(row.deltaPercent).toBeCloseTo(10);
    });

    it('assigns ladder-trap badge when ladder >= 10, tournament <= 5, delta >= 5', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([makeEntry('meowth', 15)]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([makeEntry('meowth', 3)]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      const row = result.rows.find((r) => r.speciesId === 'meowth')!;
      expect(row.badge).toBe('ladder-trap');
    });

    it('assigns tournament-staple badge when tournament >= 10, ladder <= 5, delta <= -5', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([makeEntry('amoonguss', 2)]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([makeEntry('amoonguss', 15)]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      const row = result.rows.find((r) => r.speciesId === 'amoonguss')!;
      expect(row.badge).toBe('tournament-staple');
    });

    it('assigns null badge when thresholds are not met', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([makeEntry('pikachu', 10)]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([makeEntry('pikachu', 8)]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      const row = result.rows.find((r) => r.speciesId === 'pikachu')!;
      expect(row.badge).toBeNull();
    });

    it('includes species only in ladder with 0 tournament usage', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([makeEntry('snorlax', 8)]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      const row = result.rows.find((r) => r.speciesId === 'snorlax')!;
      expect(row.tournamentPercent).toBe(0);
    });

    it('sorts rows by absolute delta descending', async () => {
      mockSmogonService.getUsageEntries.mockResolvedValue([
        makeEntry('a', 20),
        makeEntry('b', 5),
      ]);
      mockLimitlessService.getCombinedUsageEntries.mockResolvedValue([
        makeEntry('a', 5),  // delta = 15
        makeEntry('b', 15), // delta = -10
      ]);

      const result = await service.compareLadderVsTournament({
        regulationId: 'regulation-h',
        month: '2024-11',
      });

      expect(result.rows[0].absDeltaPercent).toBeGreaterThanOrEqual(result.rows[1].absDeltaPercent);
    });
  });
});
