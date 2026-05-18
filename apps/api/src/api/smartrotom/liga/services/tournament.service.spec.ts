import { Test, TestingModule } from '@nestjs/testing';
import { TournamentService } from './tournament.service';
import { LigaRepository } from '@api/smartrotom/liga/repositories/liga.repository';

const mockRepo = {
  findActiveTournaments: jest.fn(),
  findTournamentById: jest.fn(),
  findTournamentMatches: jest.fn(),
};

const mockTournament = {
  id: 1,
  name: 'Kanto League',
  maxParticipants: 8,
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  status: 'active',
} as any;

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentService,
        { provide: LigaRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<TournamentService>(TournamentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getActiveTournaments ─────────────────────────────────────────────────────

  describe('getActiveTournaments()', () => {
    it('returns active tournaments from repo', async () => {
      mockRepo.findActiveTournaments.mockResolvedValue([mockTournament]);

      await expect(service.getActiveTournaments()).resolves.toEqual([mockTournament]);
      expect(mockRepo.findActiveTournaments).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getTournamentById ────────────────────────────────────────────────────────

  describe('getTournamentById()', () => {
    it('returns tournament when found', async () => {
      mockRepo.findTournamentById.mockResolvedValue(mockTournament);

      await expect(service.getTournamentById(1)).resolves.toEqual(mockTournament);
    });

    it('throws when tournament not found', async () => {
      mockRepo.findTournamentById.mockResolvedValue(null);

      await expect(service.getTournamentById(999)).rejects.toThrow('Tournament not found');
    });

    it('throws when id is 0', async () => {
      await expect(service.getTournamentById(0)).rejects.toThrow(
        'Valid tournament ID is required',
      );
      expect(mockRepo.findTournamentById).not.toHaveBeenCalled();
    });

    it('throws when id is negative', async () => {
      await expect(service.getTournamentById(-1)).rejects.toThrow(
        'Valid tournament ID is required',
      );
    });
  });

  // ─── getTournamentMatches ─────────────────────────────────────────────────────

  describe('getTournamentMatches()', () => {
    it('validates tournament exists then returns its matches', async () => {
      mockRepo.findTournamentById.mockResolvedValue(mockTournament);
      const matches = [{ id: 1, tournamentId: 1 }] as any;
      mockRepo.findTournamentMatches.mockResolvedValue(matches);

      const result = await service.getTournamentMatches(1);

      expect(mockRepo.findTournamentById).toHaveBeenCalledWith(1);
      expect(mockRepo.findTournamentMatches).toHaveBeenCalledWith(1);
      expect(result).toEqual(matches);
    });

    it('throws when tournament does not exist', async () => {
      mockRepo.findTournamentById.mockResolvedValue(null);

      await expect(service.getTournamentMatches(999)).rejects.toThrow('Tournament not found');
      expect(mockRepo.findTournamentMatches).not.toHaveBeenCalled();
    });
  });

  // ─── createTournament ─────────────────────────────────────────────────────────

  describe('createTournament()', () => {
    const validRequest = {
      name: 'Kanto League',
      maxParticipants: 8,
      startDate: futureDate,
    };

    it('throws "not yet implemented" for a valid request', async () => {
      await expect(service.createTournament(validRequest)).rejects.toThrow(
        'Tournament creation is not yet implemented',
      );
    });

    it('throws when name is empty', async () => {
      await expect(service.createTournament({ ...validRequest, name: '' })).rejects.toThrow(
        'Tournament name is required',
      );
    });

    it('throws when name is whitespace only', async () => {
      await expect(service.createTournament({ ...validRequest, name: '   ' })).rejects.toThrow(
        'Tournament name is required',
      );
    });

    it('throws when maxParticipants is fewer than 4', async () => {
      await expect(
        service.createTournament({ ...validRequest, maxParticipants: 3 }),
      ).rejects.toThrow('Tournament must allow at least 4 participants');
    });

    it('throws when startDate is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000);
      await expect(
        service.createTournament({ ...validRequest, startDate: pastDate }),
      ).rejects.toThrow('Tournament start date must be in the future');
    });
  });

  // ─── registerForTournament ────────────────────────────────────────────────────

  describe('registerForTournament()', () => {
    it('always throws "not yet implemented"', async () => {
      await expect(
        service.registerForTournament({ tournamentId: 1, playerUuid: 'abc' }),
      ).rejects.toThrow('Tournament registration is not yet implemented');
    });
  });

  // ─── validateTournamentExists ─────────────────────────────────────────────────

  describe('validateTournamentExists()', () => {
    it('returns true when tournament is found', async () => {
      mockRepo.findTournamentById.mockResolvedValue(mockTournament);

      await expect(service.validateTournamentExists(1)).resolves.toBe(true);
    });

    it('returns false when tournament is not found', async () => {
      mockRepo.findTournamentById.mockResolvedValue(null);

      await expect(service.validateTournamentExists(999)).resolves.toBe(false);
    });

    it('returns false for invalid id (swallows the error)', async () => {
      await expect(service.validateTournamentExists(0)).resolves.toBe(false);
    });
  });
});
