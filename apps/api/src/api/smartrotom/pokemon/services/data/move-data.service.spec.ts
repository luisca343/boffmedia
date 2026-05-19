import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { MoveDataService } from './move-data.service';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockMoves = [
  {
    attackName: 'Tackle',
    attackType: 'Normal',
    attackCategory: 'Physical',
    power: 40,
    accuracy: 100,
  },
  {
    attackName: 'Thunderbolt',
    attackType: 'Electric',
    attackCategory: 'Special',
    power: 90,
    accuracy: 100,
  },
  {
    attackName: 'Thunder Wave',
    attackType: 'Electric',
    attackCategory: 'Status',
    power: 0,
    accuracy: 90,
  },
  {
    attackName: 'Surf',
    attackType: 'Water',
    attackCategory: 'Special',
    power: 90,
    accuracy: 100,
  },
];

describe('MoveDataService', () => {
  let service: MoveDataService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MoveDataService, { provide: Logger, useValue: mockLogger }],
    }).compile();

    service = module.get<MoveDataService>(MoveDataService);

    // Populate in-memory caches without hitting the filesystem
    jest.spyOn(service as any, 'readJsonFiles').mockResolvedValue(mockMoves);
    await service.loadMoveData();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMove()', () => {
    it('returns a move by exact name', () => {
      const move = service.getMove('Tackle');

      expect(move).toBeDefined();
      expect(move!.attackType).toBe('Normal');
    });

    it('returns undefined for unknown move', () => {
      expect(service.getMove('HyperBeam')).toBeUndefined();
    });
  });

  describe('getMovesOfType()', () => {
    it('returns all moves of a given type', () => {
      const electric = service.getMovesOfType('Electric');

      expect(electric).toHaveLength(2);
      expect(electric.map((m) => m.attackName)).toContain('Thunderbolt');
      expect(electric.map((m) => m.attackName)).toContain('Thunder Wave');
    });

    it('returns empty array for unknown type', () => {
      expect(service.getMovesOfType('Dragon')).toEqual([]);
    });
  });

  describe('getMovesOfCategory()', () => {
    it('returns special moves', () => {
      const special = service.getMovesOfCategory('Special');

      expect(special).toHaveLength(2);
    });

    it('returns status moves', () => {
      const status = service.getMovesOfCategory('Status');

      expect(status).toHaveLength(1);
      expect(status[0].attackName).toBe('Thunder Wave');
    });

    it('returns empty array for unknown category', () => {
      expect(service.getMovesOfCategory('Unknown')).toEqual([]);
    });
  });

  describe('getAllMoves()', () => {
    it('returns all loaded moves', () => {
      expect(service.getAllMoves()).toHaveLength(4);
    });
  });

  describe('getMovesByName()', () => {
    it('returns index object keyed by attack name', () => {
      const byName = service.getMovesByName();

      expect(byName['Tackle']).toBeDefined();
      expect(byName['Surf'].attackCategory).toBe('Special');
    });
  });

  describe('getMovesByType()', () => {
    it('returns index object keyed by type', () => {
      const byType = service.getMovesByType();

      expect(byType['Electric']).toHaveLength(2);
      expect(byType['Water']).toHaveLength(1);
    });
  });

  describe('getMovesByCategory()', () => {
    it('returns index object keyed by category', () => {
      const byCategory = service.getMovesByCategory();

      expect(byCategory['Physical']).toHaveLength(1);
      expect(byCategory['Special']).toHaveLength(2);
    });
  });
});
