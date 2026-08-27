import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VgcMetaFacadeService } from './meta.facade.service';
import { SmogonService } from './services/smogon.service';
import { VgcPastesService } from './services/vgcpastes.service';
import { PokepasteService } from './services/pokepaste.service';
import { LimitlessService } from './services/limitless.service';
import { TeamsService } from './services/teams.service';
import { StatCalcService } from './services/stat-calc.service';
import { VgcRegulationsRepository } from './repositories/regulations.repository';
import { IngestionJobsService } from './services/ingestion-jobs.service';
import { PersonalMetaAnalyticsService } from './services/personal-meta-analytics.service';
import { DivergenceService } from './services/divergence.service';

const mockSmogonService = {
  getAvailableSnapshots: jest.fn(),
  fetchAndStore: jest.fn(),
  deleteSnapshot: jest.fn(),
  getUsageList: jest.fn(),
  getUsageEntries: jest.fn(),
  getPokemonDetail: jest.fn(),
};

const mockVgcPastesService = {
  getUsageList: jest.fn(),
  getUsageEntries: jest.fn(),
  refreshRegulation: jest.fn(),
  getPasteDetail: jest.fn(),
  batchFetchRegulation: jest.fn(),
};

const mockPokepasteService = {};

const mockLimitlessService = {
  importTournament: jest.fn(),
  getUsageList: jest.fn(),
  getUsageEntries: jest.fn(),
  getCombinedUsage: jest.fn(),
  getCombinedUsageEntries: jest.fn(),
  getJobStatus: jest.fn(),
  listTournamentsByRegulation: jest.fn(),
  listTournaments: jest.fn(),
  getPlayerList: jest.fn(),
  getPlayerTeam: jest.fn(),
};

const mockTeamsService = {
  getTeamsForSpecies: jest.fn(),
};

const mockStatCalcService = {};

const mockRegulationsRepository = {
  findById: jest.fn(),
  findByFormatId: jest.fn(),
  findActive: jest.fn(),
  upsert: jest.fn(),
};

const mockIngestionJobsService = {
  listJobs: jest.fn(),
};

const mockPersonalMetaAnalyticsService = {
  comparePersonalVsMeta: jest.fn(),
};

const mockDivergenceService = {
  compareLadderVsTournament: jest.fn(),
};

const mockRegulation = {
  id: 'reg-g',
  formatId: 'gen9vgc2024regg',
  name: 'Reg G',
  vgcPastesGid: null,
};

describe('VgcMetaFacadeService', () => {
  let service: VgcMetaFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VgcMetaFacadeService,
        { provide: SmogonService, useValue: mockSmogonService },
        { provide: VgcPastesService, useValue: mockVgcPastesService },
        { provide: PokepasteService, useValue: mockPokepasteService },
        { provide: LimitlessService, useValue: mockLimitlessService },
        { provide: TeamsService, useValue: mockTeamsService },
        { provide: StatCalcService, useValue: mockStatCalcService },
        {
          provide: VgcRegulationsRepository,
          useValue: mockRegulationsRepository,
        },
        { provide: IngestionJobsService, useValue: mockIngestionJobsService },
        {
          provide: PersonalMetaAnalyticsService,
          useValue: mockPersonalMetaAnalyticsService,
        },
        { provide: DivergenceService, useValue: mockDivergenceService },
      ],
    }).compile();

    service = module.get<VgcMetaFacadeService>(VgcMetaFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Smogon ───────────────────────────────────────────────────────────────────

  describe('getAvailableSmogonSnapshots()', () => {
    it('delegates to SmogonService', async () => {
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([
        { month: '2025-12' },
      ]);
      const result = await service.getAvailableSmogonSnapshots();
      expect(result).toHaveLength(1);
    });
  });

  describe('fetchSmogonSnapshot()', () => {
    it('delegates to SmogonService when regulation exists', async () => {
      mockRegulationsRepository.findByFormatId.mockResolvedValue(
        mockRegulation,
      );
      mockSmogonService.fetchAndStore.mockResolvedValue({ rows: 100 });

      const result = await service.fetchSmogonSnapshot({
        format: 'gen9vgc2024regg',
        month: '2025-12',
      });

      expect(mockSmogonService.fetchAndStore).toHaveBeenCalled();
      expect(result).toEqual({ rows: 100 });
    });

    it('throws NotFoundException when format is not registered', async () => {
      mockRegulationsRepository.findByFormatId.mockResolvedValue(null);

      await expect(
        service.fetchSmogonSnapshot({ format: 'unknown', month: '2025-12' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSmogonUsage()', () => {
    it('uses provided month directly', async () => {
      mockSmogonService.getUsageList.mockResolvedValue([]);

      await service.getSmogonUsage({
        format: 'gen9vgc2024regg',
        month: '2025-12',
      });

      expect(mockSmogonService.getUsageList).toHaveBeenCalledWith(
        'gen9vgc2024regg',
        '2025-12',
        expect.any(Number),
      );
    });

    it('resolves the most recent month when month is not provided', async () => {
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([
        { formatId: 'gen9vgc2024regg', month: '2025-11', cutoff: 1760 },
      ]);
      mockSmogonService.getUsageList.mockResolvedValue([]);

      await service.getSmogonUsage({ format: 'gen9vgc2024regg' });

      expect(mockSmogonService.getUsageList).toHaveBeenCalledWith(
        'gen9vgc2024regg',
        '2025-11',
        1760,
      );
    });

    it('throws NotFoundException when no snapshot exists for format', async () => {
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([]);

      await expect(
        service.getSmogonUsage({ format: 'gen9vgc2024regg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Champions (VGCPastes) ────────────────────────────────────────────────────

  describe('getChampionsUsage()', () => {
    it('returns usage when regulation has vgcPastesGid', async () => {
      const reg = { ...mockRegulation, vgcPastesGid: 'gid-1' };
      mockRegulationsRepository.findById.mockResolvedValue(reg);
      mockVgcPastesService.getUsageList.mockResolvedValue([
        { speciesId: 'pikachu' },
      ]);

      const result = await service.getChampionsUsage({ regulationId: 'reg-g' });

      expect(result).toHaveLength(1);
    });

    it('throws NotFoundException when regulation not found', async () => {
      mockRegulationsRepository.findById.mockResolvedValue(null);

      await expect(
        service.getChampionsUsage({ regulationId: 'unknown' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when regulation has no vgcPastesGid', async () => {
      mockRegulationsRepository.findById.mockResolvedValue({
        ...mockRegulation,
        vgcPastesGid: null,
      });

      await expect(
        service.getChampionsUsage({ regulationId: 'reg-g' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Limitless ────────────────────────────────────────────────────────────────

  describe('importLimitlessTournament()', () => {
    it('delegates to LimitlessService', async () => {
      mockLimitlessService.importTournament.mockResolvedValue({
        tournamentId: 1,
      });

      const result = await service.importLimitlessTournament({
        url: 'https://limitless.gg/tournament/abc',
        regulationId: 'reg-g',
        maxPlayers: 50,
      });

      expect(mockLimitlessService.importTournament).toHaveBeenCalledWith(
        'https://limitless.gg/tournament/abc',
        'reg-g',
        50,
      );
      expect(result).toEqual({ tournamentId: 1 });
    });
  });

  describe('listLimitlessTournaments()', () => {
    it('delegates to LimitlessService', async () => {
      mockLimitlessService.listTournaments.mockResolvedValue([{ id: 1 }]);
      const result = await service.listLimitlessTournaments();
      expect(result).toHaveLength(1);
    });
  });

  // ─── Unified usage ────────────────────────────────────────────────────────────

  describe('getUnifiedUsageDetailList()', () => {
    it('uses VGCPastes when regulation has vgcPastesGid', async () => {
      const reg = { ...mockRegulation, vgcPastesGid: 'gid-1' };
      mockRegulationsRepository.findById.mockResolvedValue(reg);
      mockVgcPastesService.getUsageList.mockResolvedValue([]);

      await service.getUnifiedUsageDetailList('reg-g');

      expect(mockVgcPastesService.getUsageList).toHaveBeenCalledWith('reg-g');
      expect(mockSmogonService.getUsageList).not.toHaveBeenCalled();
    });

    it('uses Smogon when regulation has formatId but no vgcPastesGid', async () => {
      mockRegulationsRepository.findById.mockResolvedValue(mockRegulation);
      mockSmogonService.getAvailableSnapshots.mockResolvedValue([
        { formatId: 'gen9vgc2024regg', month: '2025-12', cutoff: 1760 },
      ]);
      mockSmogonService.getUsageList.mockResolvedValue([]);

      await service.getUnifiedUsageDetailList('reg-g');

      expect(mockSmogonService.getUsageList).toHaveBeenCalled();
    });

    it('falls back to Limitless when no formatId and no vgcPastesGid', async () => {
      mockRegulationsRepository.findById.mockResolvedValue({
        id: 'reg-g',
        formatId: null,
        vgcPastesGid: null,
      });
      mockLimitlessService.getCombinedUsage.mockResolvedValue([]);

      await service.getUnifiedUsageDetailList('reg-g');

      expect(mockLimitlessService.getCombinedUsage).toHaveBeenCalledWith(
        'reg-g',
      );
    });

    it('throws NotFoundException when regulation not found', async () => {
      mockRegulationsRepository.findById.mockResolvedValue(null);
      await expect(
        service.getUnifiedUsageDetailList('missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Regulations ─────────────────────────────────────────────────────────────

  describe('getRegulations()', () => {
    it('returns all active regulations', async () => {
      mockRegulationsRepository.findActive.mockResolvedValue([mockRegulation]);
      const result = await service.getRegulations();
      expect(result).toHaveLength(1);
    });
  });

  describe('upsertRegulation()', () => {
    it('upserts and returns the updated regulation', async () => {
      mockRegulationsRepository.upsert.mockResolvedValue(undefined);
      mockRegulationsRepository.findById.mockResolvedValue(mockRegulation);

      const result = await service.upsertRegulation({
        id: 'reg-g',
        formatId: 'gen9vgc2024regg',
        name: 'Reg G',
        gameType: 'singles',
        vgcPastesGid: null,
      });

      expect(mockRegulationsRepository.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockRegulation);
    });

    it('defaults formatId to id when omitted', async () => {
      mockRegulationsRepository.upsert.mockResolvedValue(undefined);
      mockRegulationsRepository.findById.mockResolvedValue(mockRegulation);

      await service.upsertRegulation({
        id: 'gen9vgc2024regg',
        name: 'Reg G',
      });

      expect(mockRegulationsRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ formatId: 'gen9vgc2024regg' }),
      );
    });

    it('rejects a formatId the sim does not know on create', async () => {
      // No existing row: this is a create, so the unknown format is fatal.
      mockRegulationsRepository.findById.mockResolvedValue(null);

      await expect(
        service.upsertRegulation({
          id: 'vgc2026regzz',
          formatId: 'notaformat',
          name: 'Nope',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockRegulationsRepository.upsert).not.toHaveBeenCalled();
    });

    it('allows editing an existing row whose format is unregistered', async () => {
      mockRegulationsRepository.findById.mockResolvedValue(mockRegulation);
      mockRegulationsRepository.upsert.mockResolvedValue(undefined);

      await service.upsertRegulation({
        id: 'vgc2026regzz',
        formatId: 'notaformat',
        name: 'Still editable',
      });

      expect(mockRegulationsRepository.upsert).toHaveBeenCalled();
    });
  });

  // ─── Ingestion jobs ───────────────────────────────────────────────────────────

  describe('getIngestionJobs()', () => {
    it('delegates to IngestionJobsService', async () => {
      mockIngestionJobsService.listJobs.mockResolvedValue([]);
      await service.getIngestionJobs('reg-g');
      expect(mockIngestionJobsService.listJobs).toHaveBeenCalledWith('reg-g');
    });
  });

  // ─── Divergence ───────────────────────────────────────────────────────────────

  describe('getDivergence()', () => {
    it('delegates to DivergenceService', async () => {
      mockDivergenceService.compareLadderVsTournament.mockResolvedValue({
        rows: [],
      });

      const result = await service.getDivergence({ regulationId: 'reg-g' });

      expect(
        mockDivergenceService.compareLadderVsTournament,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ regulationId: 'reg-g' }),
      );
      expect(result).toEqual({ rows: [] });
    });
  });
});
