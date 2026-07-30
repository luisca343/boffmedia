import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { KARTS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { KartsService } from './karts.service';

const mockRepository = {
  saveRace: jest.fn(),
  findTopTimes: jest.fn(),
  findPlayerStats: jest.fn(),
};

const VALID_UUID = '67d9b543-5ac9-41e1-a8a5-20d7689e24a4';

describe('KartsService', () => {
  let service: KartsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        KartsService,
        { provide: KARTS_REPOSITORY_TOKEN, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(KartsService);
  });

  describe('saveRace()', () => {
    it('converts the epoch-millis fecha to a Date and splits off the grid', async () => {
      mockRepository.saveRace.mockResolvedValue({ insertId: 7 });

      const result = await service.saveRace({
        server: 'srv',
        circuito: 'Rainbow Road',
        modo: 'clasica',
        vueltas: 3,
        fecha: 1737200000000,
        participantes: [
          {
            uuid: VALID_UUID,
            nombre: 'Ana',
            posicion: 1,
            tiempoMs: 90500,
            mejorVueltaMs: 29800,
            vueltasCompletadas: 3,
            dnf: false,
          },
        ],
      });

      expect(result).toEqual({ saved: true, id: 7 });
      const [race, participants] = mockRepository.saveRace.mock.calls[0];
      expect(race.fecha).toEqual(new Date(1737200000000));
      expect(race).not.toHaveProperty('participantes');
      expect(participants).toHaveLength(1);
    });

    it('stores the -1 sentinels untouched', async () => {
      mockRepository.saveRace.mockResolvedValue({ insertId: 8 });

      await service.saveRace({
        server: 'srv',
        circuito: 'Rainbow Road',
        modo: 'eliminacion',
        vueltas: 3,
        fecha: 1737200000000,
        participantes: [
          {
            uuid: VALID_UUID,
            nombre: 'Beto',
            posicion: 4,
            tiempoMs: -1,
            mejorVueltaMs: -1,
            vueltasCompletadas: 0,
            dnf: true,
          },
        ],
      });

      const [, participants] = mockRepository.saveRace.mock.calls[0];
      expect(participants[0]).toMatchObject({
        tiempoMs: -1,
        mejorVueltaMs: -1,
      });
    });
  });

  describe('getRanking()', () => {
    it('rejects a non-clasica mode instead of returning a meaningless leaderboard', async () => {
      await expect(
        service.getRanking('Rainbow Road', 'eliminacion'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockRepository.findTopTimes).not.toHaveBeenCalled();
    });

    it('accepts an explicit clasica mode', async () => {
      mockRepository.findTopTimes.mockResolvedValue([]);

      await service.getRanking('Rainbow Road', 'clasica', 5);

      expect(mockRepository.findTopTimes).toHaveBeenCalledWith({
        circuito: 'Rainbow Road',
        limit: 5,
      });
    });

    it('caps the limit and defaults it', async () => {
      mockRepository.findTopTimes.mockResolvedValue([]);

      await service.getRanking(undefined, undefined, 5000);
      expect(mockRepository.findTopTimes).toHaveBeenCalledWith({
        circuito: undefined,
        limit: 100,
      });

      await service.getRanking();
      expect(mockRepository.findTopTimes).toHaveBeenLastCalledWith({
        circuito: undefined,
        limit: 10,
      });
    });
  });

  describe('getPlayerStats()', () => {
    it('throws 404 for a uuid that has never raced', async () => {
      mockRepository.findPlayerStats.mockResolvedValue(null);

      await expect(service.getPlayerStats(VALID_UUID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
