import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { GamesRepository } from '../../../_repositories/boffmedia/games.repository';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  softDeleteEventsByGame: jest.fn(),
};

const mockGame = {
  id: 1,
  title: 'Pokémon Tournament',
  description: 'Battle your way to the top',
  icon: 'trophy.png',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GamesService', () => {
  let service: GamesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        { provide: GamesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllGames ───────────────────────────────────────────────────────────────

  describe('getAllGames()', () => {
    it('returns all games from repo', async () => {
      mockRepo.findAll.mockResolvedValue([mockGame]);

      await expect(service.getAllGames()).resolves.toEqual([mockGame]);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getGameById ──────────────────────────────────────────────────────────────

  describe('getGameById()', () => {
    it('returns game by id', async () => {
      mockRepo.findById.mockResolvedValue(mockGame);

      await expect(service.getGameById(1)).resolves.toEqual(mockGame);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });
  });

  // ─── createGame ───────────────────────────────────────────────────────────────

  describe('createGame()', () => {
    const dto = {
      title: 'Pokémon Tournament',
      description: 'Battle your way to the top',
      icon: 'trophy.png',
    };

    it('creates game and returns by insertId', async () => {
      mockRepo.create.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue(mockGame);

      const result = await service.createGame(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          description: dto.description,
        }),
      );
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGame);
    });
  });

  // ─── updateGame ───────────────────────────────────────────────────────────────

  describe('updateGame()', () => {
    const dto = {
      title: 'Updated Title',
      description: 'New desc',
      icon: 'new.png',
    } as any;

    it('updates game and returns refreshed entity', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue({
        ...mockGame,
        title: 'Updated Title',
      });

      const result = await service.updateGame(1, dto);

      expect(mockRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated Title' }),
      );
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result.title).toBe('Updated Title');
    });
  });

  // ─── deleteGame ───────────────────────────────────────────────────────────────

  describe('deleteGame()', () => {
    it('soft-deletes associated events first, then the game', async () => {
      mockRepo.softDeleteEventsByGame.mockResolvedValue(undefined);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.deleteGame(1);

      expect(mockRepo.softDeleteEventsByGame).toHaveBeenCalledWith(1);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('deletes events before deleting the game (order matters)', async () => {
      const callOrder: string[] = [];
      mockRepo.softDeleteEventsByGame.mockImplementation(async () => {
        callOrder.push('events');
      });
      mockRepo.softDelete.mockImplementation(async () => {
        callOrder.push('game');
      });

      await service.deleteGame(1);

      expect(callOrder).toEqual(['events', 'game']);
    });
  });

  // ─── validateGameExists ───────────────────────────────────────────────────────

  describe('validateGameExists()', () => {
    it('returns true when game is found', async () => {
      mockRepo.findById.mockResolvedValue(mockGame);

      await expect(service.validateGameExists(1)).resolves.toBe(true);
    });

    it('returns false when game is not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.validateGameExists(999)).resolves.toBe(false);
    });
  });
});
