import { Test, TestingModule } from '@nestjs/testing';
import { TcgFacadeService } from './tcg.facade.service';
import { TcgService } from './services/tcg.service';

const mockTcgService = {
  getSetsForSeriesFromDb: jest.fn(),
  getCardsForSetFromDb: jest.fn(),
  getCardById: jest.fn(),
  fetchAndStoreCardsForSet: jest.fn(),
  getAll: jest.fn(),
  fetchAndStoreSeries: jest.fn(),
  fetchSetsForSeries: jest.fn(),
  fetchSetsForSeriesBothLanguages: jest.fn(),
  fetchAndStoreCardsForSetBothLanguages: jest.fn(),
  getUserCards: jest.fn(),
  addUserCard: jest.fn(),
  updateUserCardQuantity: jest.fn(),
  removeUserCard: jest.fn(),
  getUserCardHistory: jest.fn(),
  migrateOldUserCards: jest.fn(),
};

describe('TcgFacadeService', () => {
  let service: TcgFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgFacadeService,
        { provide: TcgService, useValue: mockTcgService },
      ],
    }).compile();

    service = module.get<TcgFacadeService>(TcgFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSetsForSeriesFromDb()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.getSetsForSeriesFromDb.mockResolvedValue([{ id: 'sv1' }]);

      const result = await service.getSetsForSeriesFromDb('sv');

      expect(mockTcgService.getSetsForSeriesFromDb).toHaveBeenCalledWith('sv');
      expect(result).toEqual([{ id: 'sv1' }]);
    });
  });

  describe('getCardsForSetFromDb()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.getCardsForSetFromDb.mockResolvedValue([{ id: 'sv1-1' }]);

      const result = await service.getCardsForSetFromDb('sv1');

      expect(result).toEqual([{ id: 'sv1-1' }]);
    });
  });

  describe('getCardById()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.getCardById.mockResolvedValue({ id: 'sv1-1', name: 'Pikachu' });

      const result = await service.getCardById('sv1-1');

      expect(result.name).toBe('Pikachu');
    });
  });

  describe('fetchAndStoreCardsForSet()', () => {
    it('passes default locale "en"', async () => {
      mockTcgService.fetchAndStoreCardsForSet.mockResolvedValue({ stored: 10 });

      await service.fetchAndStoreCardsForSet('sv1');

      expect(mockTcgService.fetchAndStoreCardsForSet).toHaveBeenCalledWith('sv1', 'en');
    });
  });

  describe('getAllSeries()', () => {
    it('delegates to TcgService.getAll', async () => {
      mockTcgService.getAll.mockResolvedValue([{ id: 'sv' }]);

      const result = await service.getAllSeries();

      expect(mockTcgService.getAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'sv' }]);
    });
  });

  describe('getUserCards()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.getUserCards.mockResolvedValue([{ cardId: 'sv1-1', qty: 2 }]);

      const result = await service.getUserCards('Ash');

      expect(mockTcgService.getUserCards).toHaveBeenCalledWith('Ash');
      expect(result).toHaveLength(1);
    });
  });

  describe('addUserCard()', () => {
    it('delegates to TcgService', async () => {
      const dto = { cardId: 'sv1-1', userId: 1 } as any;
      mockTcgService.addUserCard.mockResolvedValue({ id: 1 });

      const result = await service.addUserCard(dto);

      expect(mockTcgService.addUserCard).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('removeUserCard()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.removeUserCard.mockResolvedValue({ success: true });

      await service.removeUserCard(1, 'sv1-1');

      expect(mockTcgService.removeUserCard).toHaveBeenCalledWith(1, 'sv1-1');
    });
  });

  describe('migrateOldUserCards()', () => {
    it('delegates to TcgService', async () => {
      mockTcgService.migrateOldUserCards.mockResolvedValue({ migrated: 5 });

      const result = await service.migrateOldUserCards();

      expect(result).toEqual({ migrated: 5 });
    });
  });
});
