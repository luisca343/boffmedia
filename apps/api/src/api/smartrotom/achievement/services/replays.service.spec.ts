import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReplaysService } from './replays.service';
import { REPLAYS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  create: jest.fn(),
  createUserReplay: jest.fn(),
  findUserReplay: jest.fn(),
};

const UUID = 'abc-123-uuid';
const REPLAY_ID = 5;

const validReplayDto = {
  side1: 'TrainerAsh',
  side2: 'TrainerGary',
  team1: '[{"name":"Pikachu"}]',
  team2: '[{"name":"Blastoise"}]',
  replay: 'replay-data-base64',
  winner: 'TrainerAsh',
};

describe('ReplaysService', () => {
  let service: ReplaysService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplaysService,
        { provide: REPLAYS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReplaysService>(ReplaysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createReplay ─────────────────────────────────────────────────────────────

  describe('createReplay()', () => {
    it('creates replay and returns insertId from repo result id', async () => {
      mockRepo.create.mockResolvedValue({ id: 10 });

      const result = await service.createReplay(validReplayDto);

      expect(result).toEqual({ insertId: 10 });
      expect(mockRepo.create).toHaveBeenCalledWith(validReplayDto);
    });

    it('throws BadRequestException when side1 is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, side1: '' })).rejects.toThrow(
        'Player 1 name is required',
      );
    });

    it('throws BadRequestException when side2 is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, side2: '' })).rejects.toThrow(
        'Player 2 name is required',
      );
    });

    it('throws BadRequestException when team1 is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, team1: '' })).rejects.toThrow(
        'Player 1 team data is required',
      );
    });

    it('throws BadRequestException when team2 is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, team2: '' })).rejects.toThrow(
        'Player 2 team data is required',
      );
    });

    it('throws BadRequestException when replay data is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, replay: '' })).rejects.toThrow(
        'Replay data is required',
      );
    });

    it('throws BadRequestException when winner is missing', async () => {
      await expect(service.createReplay({ ...validReplayDto, winner: '' })).rejects.toThrow(
        'Winner is required',
      );
    });

    it('does not call repo when validation fails', async () => {
      await expect(service.createReplay({ ...validReplayDto, side1: '' })).rejects.toThrow(BadRequestException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  // ─── createUserReplay ─────────────────────────────────────────────────────────

  describe('createUserReplay()', () => {
    it('constructs UserReplayEntity with side=1 and delegates to repo', async () => {
      mockRepo.createUserReplay.mockResolvedValue({ insertId: 99 });

      const result = await service.createUserReplay(UUID, REPLAY_ID);

      expect(result).toEqual({ insertId: 99 });
      expect(mockRepo.createUserReplay).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: UUID, replayId: REPLAY_ID, side: 1 }),
      );
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.createUserReplay('', REPLAY_ID)).rejects.toThrow(
        'UUID is required',
      );
      expect(mockRepo.createUserReplay).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when replayId is 0', async () => {
      await expect(service.createUserReplay(UUID, 0)).rejects.toThrow(
        'Valid replay ID is required',
      );
    });

    it('throws BadRequestException when replayId is negative', async () => {
      await expect(service.createUserReplay(UUID, -1)).rejects.toThrow(
        'Valid replay ID is required',
      );
    });
  });

  // ─── getUserReplay ────────────────────────────────────────────────────────────

  describe('getUserReplay()', () => {
    const mockReplay = { id: REPLAY_ID, side1: 'TrainerAsh', winner: 'TrainerAsh' } as any;

    it('returns replay from repo', async () => {
      mockRepo.findUserReplay.mockResolvedValue(mockReplay);

      await expect(service.getUserReplay(UUID, REPLAY_ID)).resolves.toEqual(mockReplay);
      expect(mockRepo.findUserReplay).toHaveBeenCalledWith(UUID, REPLAY_ID);
    });

    it('returns null when replay not found', async () => {
      mockRepo.findUserReplay.mockResolvedValue(null);

      await expect(service.getUserReplay(UUID, REPLAY_ID)).resolves.toBeNull();
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getUserReplay('', REPLAY_ID)).rejects.toThrow('UUID is required');
    });

    it('throws BadRequestException when replayId is invalid', async () => {
      await expect(service.getUserReplay(UUID, -5)).rejects.toThrow('Valid replay ID is required');
    });
  });
});
