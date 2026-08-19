import { Test, TestingModule } from '@nestjs/testing';
import { PcMarksService } from './pc-marks.service';
import { PC_MARKS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PcMark } from '../entities/pc-mark.entity';

const mockRepo = {
  findByUser: jest.fn(),
  findByKeys: jest.fn(),
  findOne: jest.fn(),
  upsert: jest.fn(),
  upsertMany: jest.fn(),
};

const UUID = 'player-uuid';
const KEY_A = '25|0|adamant|static|31,31,31,31,31,31';
const KEY_B = '6|1|jolly|blaze|31,31,31,31,31,31';

const makeMark = (
  pokemonKey: string,
  favorite = false,
  tags: string[] = [],
  id = 1,
): PcMark => ({ id, uuid: UUID, pokemonKey, favorite, tags });

describe('PcMarksService', () => {
  let service: PcMarksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PcMarksService,
        { provide: PC_MARKS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PcMarksService>(PcMarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertMark', () => {
    it('creates a mark when none exists, defaulting the untouched fields', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.upsert.mockImplementation(
        (
          uuid: string,
          key: string,
          data: { favorite: boolean; tags: string[] },
        ) => Promise.resolve(makeMark(key, data.favorite, data.tags)),
      );

      const result = await service.upsertMark(UUID, {
        pokemonKey: KEY_A,
        favorite: true,
      });

      expect(mockRepo.upsert).toHaveBeenCalledWith(UUID, KEY_A, {
        favorite: true,
        tags: [],
      });
      expect(result.favorite).toBe(true);
      expect(result.tags).toEqual([]);
    });

    it('patches only the provided fields of an existing mark', async () => {
      mockRepo.findOne.mockResolvedValue(
        makeMark(KEY_A, true, ['competitivo']),
      );
      mockRepo.upsert.mockImplementation(
        (
          uuid: string,
          key: string,
          data: { favorite: boolean; tags: string[] },
        ) => Promise.resolve(makeMark(key, data.favorite, data.tags)),
      );

      // Only `tags` is sent — `favorite` must keep its stored value.
      const result = await service.upsertMark(UUID, {
        pokemonKey: KEY_A,
        tags: ['shiny'],
      });

      expect(mockRepo.upsert).toHaveBeenCalledWith(UUID, KEY_A, {
        favorite: true,
        tags: ['shiny'],
      });
      expect(result.favorite).toBe(true);
      expect(result.tags).toEqual(['shiny']);
    });

    it('un-favourites via favorite: false without touching the tags', async () => {
      mockRepo.findOne.mockResolvedValue(makeMark(KEY_A, true, ['shiny']));
      mockRepo.upsert.mockResolvedValue(makeMark(KEY_A, false, ['shiny']));

      await service.upsertMark(UUID, {
        pokemonKey: KEY_A,
        favorite: false,
      });

      expect(mockRepo.upsert).toHaveBeenCalledWith(UUID, KEY_A, {
        favorite: false,
        tags: ['shiny'],
      });
    });
  });

  describe('bulkUpsert', () => {
    it('adds and removes tags per key, merging with what each key already has', async () => {
      mockRepo.findByKeys.mockResolvedValue([
        makeMark(KEY_A, false, ['por-revisar', 'shiny'], 1),
      ]);
      mockRepo.upsertMany.mockImplementation(
        (
          _uuid: string,
          rows: { pokemonKey: string; favorite: boolean; tags: string[] }[],
        ) =>
          Promise.resolve(
            rows.map((r, i) =>
              makeMark(r.pokemonKey, r.favorite, r.tags, i + 1),
            ),
          ),
      );

      const result = await service.bulkUpsert(UUID, {
        pokemonKeys: [KEY_A, KEY_B],
        favorite: true,
        addTags: ['competitivo'],
        removeTags: ['por-revisar'],
      });

      expect(mockRepo.upsertMany).toHaveBeenCalledWith(UUID, [
        // existing: shiny kept, por-revisar dropped, competitivo added
        { pokemonKey: KEY_A, favorite: true, tags: ['shiny', 'competitivo'] },
        // absent: created from the delta alone
        { pokemonKey: KEY_B, favorite: true, tags: ['competitivo'] },
      ]);
      expect(result).toHaveLength(2);
    });

    it("keeps each key's stored favourite when the flag is omitted", async () => {
      mockRepo.findByKeys.mockResolvedValue([makeMark(KEY_A, true, [])]);
      mockRepo.upsertMany.mockResolvedValue([]);

      await service.bulkUpsert(UUID, {
        pokemonKeys: [KEY_A, KEY_B],
        addTags: ['shiny'],
      });

      expect(mockRepo.upsertMany).toHaveBeenCalledWith(UUID, [
        { pokemonKey: KEY_A, favorite: true, tags: ['shiny'] },
        { pokemonKey: KEY_B, favorite: false, tags: ['shiny'] },
      ]);
    });

    it('is a no-op when no keys are given', async () => {
      const result = await service.bulkUpsert(UUID, {
        pokemonKeys: [],
        favorite: true,
        addTags: ['shiny'],
      });

      expect(result).toEqual([]);
      expect(mockRepo.findByKeys).not.toHaveBeenCalled();
      expect(mockRepo.upsertMany).not.toHaveBeenCalled();
    });
  });

  describe('getMarks', () => {
    it('returns every mark for the user', async () => {
      const marks = [makeMark(KEY_A, true, ['shiny'])];
      mockRepo.findByUser.mockResolvedValue(marks);

      await expect(service.getMarks(UUID)).resolves.toEqual(marks);
      expect(mockRepo.findByUser).toHaveBeenCalledWith(UUID);
    });

    it('rejects an empty uuid', async () => {
      await expect(service.getMarks('')).rejects.toThrow('UUID is required');
    });
  });
});
