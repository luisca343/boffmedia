import { Test, TestingModule } from '@nestjs/testing';
import { IngestionJobsService } from './ingestion-jobs.service';
import { SmogonRepository } from '../repositories/smogon.repository';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { LimitlessRepository } from '../repositories/limitless.repository';

const mockSmogonRepository = {
  findAvailableSnapshots: jest.fn(),
};

const mockRegulationsRepository = {
  findActive: jest.fn(),
};

const mockLimitlessRepository = {
  findTournamentsByRegulation: jest.fn(),
  findAllTournaments: jest.fn(),
};

const makeSnapshot = (overrides: Partial<any> = {}) => ({
  formatId: 'gen9vgc2024regh',
  month: '2024-11',
  cutoff: 1760,
  fetchedAt: new Date('2024-11-15'),
  pokemonCount: 50,
  ...overrides,
});

const makeRegulation = (overrides: Partial<any> = {}) => ({
  id: 'regulation-h',
  formatId: 'gen9vgc2024regh',
  name: 'Regulation H',
  importStatus: 'done',
  importFetchedCount: 100,
  importTeamCount: 100,
  importStartedAt: new Date('2024-11-01'),
  importCompletedAt: new Date('2024-11-02'),
  importError: null,
  ...overrides,
});

const makeTournament = (overrides: Partial<any> = {}) => ({
  id: 1,
  limitlessId: 'abc123',
  regulationId: 'regulation-h',
  name: 'Worlds 2024',
  date: '2024-08-16',
  format: 'vgc2024regh',
  status: 'done',
  fetchedAt: new Date('2024-08-20'),
  progress: 500,
  total: 500,
  errorMessage: null,
  ...overrides,
});

describe('IngestionJobsService', () => {
  let service: IngestionJobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSmogonRepository.findAvailableSnapshots.mockResolvedValue([]);
    mockRegulationsRepository.findActive.mockResolvedValue([]);
    mockLimitlessRepository.findAllTournaments.mockResolvedValue([]);
    mockLimitlessRepository.findTournamentsByRegulation.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionJobsService,
        { provide: SmogonRepository, useValue: mockSmogonRepository },
        { provide: VgcRegulationsRepository, useValue: mockRegulationsRepository },
        { provide: LimitlessRepository, useValue: mockLimitlessRepository },
      ],
    }).compile();

    service = module.get<IngestionJobsService>(IngestionJobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── listJobs ────────────────────────────────────────────────────────────────

  describe('listJobs()', () => {
    it('returns empty array when there is no data', async () => {
      const jobs = await service.listJobs();
      expect(jobs).toEqual([]);
    });

    it('maps a smogon snapshot to a smogon_snapshot job with status done', async () => {
      mockSmogonRepository.findAvailableSnapshots.mockResolvedValue([makeSnapshot()]);

      const jobs = await service.listJobs();
      const job = jobs.find((j) => j.type === 'smogon_snapshot');

      expect(job).toBeDefined();
      expect(job!.id).toBe('smogon:gen9vgc2024regh:2024-11:1760');
      expect(job!.status).toBe('done');
      expect(job!.metadata).toMatchObject({
        formatId: 'gen9vgc2024regh',
        month: '2024-11',
        cutoff: 1760,
        pokemonCount: 50,
      });
    });

    it('maps a regulation to a champions_regulation job', async () => {
      mockRegulationsRepository.findActive.mockResolvedValue([makeRegulation()]);

      const jobs = await service.listJobs();
      const job = jobs.find((j) => j.type === 'champions_regulation');

      expect(job).toBeDefined();
      expect(job!.id).toBe('champions:regulation-h');
      expect(job!.status).toBe('done');
      expect(job!.progress).toBe(100);
      expect(job!.total).toBe(100);
    });

    it('maps a tournament to a limitless_tournament job', async () => {
      mockLimitlessRepository.findAllTournaments.mockResolvedValue([makeTournament()]);

      const jobs = await service.listJobs();
      const job = jobs.find((j) => j.type === 'limitless_tournament');

      expect(job).toBeDefined();
      expect(job!.id).toBe('limitless:1');
      expect(job!.status).toBe('done');
      expect(job!.metadata).toMatchObject({ tournamentId: 1, regulationId: 'regulation-h' });
    });

    it('returns jobs in order: champions → limitless → smogon', async () => {
      mockSmogonRepository.findAvailableSnapshots.mockResolvedValue([makeSnapshot()]);
      mockRegulationsRepository.findActive.mockResolvedValue([makeRegulation()]);
      mockLimitlessRepository.findAllTournaments.mockResolvedValue([makeTournament()]);

      const jobs = await service.listJobs();
      const types = jobs.map((j) => j.type);

      expect(types.indexOf('champions_regulation')).toBeLessThan(types.indexOf('limitless_tournament'));
      expect(types.indexOf('limitless_tournament')).toBeLessThan(types.indexOf('smogon_snapshot'));
    });

    it('uses findAllTournaments when no regulationId is provided', async () => {
      await service.listJobs();

      expect(mockLimitlessRepository.findAllTournaments).toHaveBeenCalled();
      expect(mockLimitlessRepository.findTournamentsByRegulation).not.toHaveBeenCalled();
    });

    it('uses findTournamentsByRegulation when regulationId is provided', async () => {
      await service.listJobs('regulation-h');

      expect(mockLimitlessRepository.findTournamentsByRegulation).toHaveBeenCalledWith('regulation-h');
      expect(mockLimitlessRepository.findAllTournaments).not.toHaveBeenCalled();
    });

    it('filters champions to the given regulationId', async () => {
      mockRegulationsRepository.findActive.mockResolvedValue([
        makeRegulation({ id: 'regulation-g', name: 'Regulation G' }),
        makeRegulation({ id: 'regulation-h', name: 'Regulation H' }),
      ]);

      const jobs = await service.listJobs('regulation-h');
      const champJobs = jobs.filter((j) => j.type === 'champions_regulation');

      expect(champJobs).toHaveLength(1);
      expect(champJobs[0].id).toBe('champions:regulation-h');
    });
  });

  // ─── normalizeStatus mapping (exercised via champion jobs) ──────────────────

  describe('normalizeStatus mapping', () => {
    it.each([
      ['done', 'done'],
      ['error', 'error'],
      ['idle', 'idle'],
      ['pending', 'queued'],
      ['running_fetch', 'running'],
      ['running', 'running'],
      [null, 'idle'],
      [undefined, 'idle'],
      ['unknown_value', 'idle'],
    ] as [string | null | undefined, string][])(
      'maps importStatus %p → job status %p',
      async (inputStatus, expectedStatus) => {
        mockRegulationsRepository.findActive.mockResolvedValue([
          makeRegulation({ id: 'test', importStatus: inputStatus }),
        ]);

        const jobs = await service.listJobs();
        const job = jobs.find((j) => j.type === 'champions_regulation');

        expect(job!.status).toBe(expectedStatus);
      },
    );
  });
});
