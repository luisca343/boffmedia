import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { Logger } from 'nestjs-pino';
import { TcgFetchService } from './tcg-fetch.service';
import { TcgErrorService } from './tcg-error.service';
import { TcgConfigService } from './tcg-config.service';

const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
const mockHttpService = { get: jest.fn() };
const mockErrorService = {
  handleApiError: jest.fn().mockImplementation((error: any, op: string) => {
    throw new HttpException(`${op} failed`, HttpStatus.BAD_GATEWAY);
  }),
  validateSeriesId: jest.fn(),
  validateSetId: jest.fn(),
  validateLocale: jest.fn(),
};
const mockConfigService = {
  getSeriesUrl: jest.fn(
    (locale: string) => `https://api.tcgdex.net/v2/${locale}/series`,
  ),
  getSeriesDetailUrl: jest.fn(
    (locale: string, id: string) =>
      `https://api.tcgdex.net/v2/${locale}/series/${id}`,
  ),
  getSetUrl: jest.fn(
    (locale: string, id: string) =>
      `https://api.tcgdex.net/v2/${locale}/sets/${id}`,
  ),
  getCardUrl: jest.fn(
    (locale: string, id: string) =>
      `https://api.tcgdex.net/v2/${locale}/cards/${id}`,
  ),
};

describe('TcgFetchService', () => {
  let service: TcgFetchService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockErrorService.handleApiError.mockImplementation(
      (error: any, op: string) => {
        throw new HttpException(`${op} failed`, HttpStatus.BAD_GATEWAY);
      },
    );
    mockConfigService.getSeriesUrl.mockImplementation(
      (locale: string) => `https://api.tcgdex.net/v2/${locale}/series`,
    );
    mockConfigService.getSeriesDetailUrl.mockImplementation(
      (locale: string, id: string) =>
        `https://api.tcgdex.net/v2/${locale}/series/${id}`,
    );
    mockConfigService.getSetUrl.mockImplementation(
      (locale: string, id: string) =>
        `https://api.tcgdex.net/v2/${locale}/sets/${id}`,
    );
    mockConfigService.getCardUrl.mockImplementation(
      (locale: string, id: string) =>
        `https://api.tcgdex.net/v2/${locale}/cards/${id}`,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgFetchService,
        { provide: Logger, useValue: mockLogger },
        { provide: HttpService, useValue: mockHttpService },
        { provide: TcgErrorService, useValue: mockErrorService },
        { provide: TcgConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TcgFetchService>(TcgFetchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── fetchAndMergeSeries ──────────────────────────────────────────────────────

  describe('fetchAndMergeSeries()', () => {
    it('merges EN and ES series by id', async () => {
      mockHttpService.get
        .mockReturnValueOnce(
          of({
            data: [
              {
                id: 'sv',
                name: 'Scarlet & Violet',
                logo: 'https://img/sv.png',
              },
            ],
          }),
        )
        .mockReturnValueOnce(
          of({
            data: [
              {
                id: 'sv',
                name: 'Escarlata y Violeta',
                logo: 'https://img/sv.png',
              },
            ],
          }),
        );

      const result = await service.fetchAndMergeSeries();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sv');
      expect(result[0].name_en).toBe('Scarlet & Violet');
      expect(result[0].name_es).toBe('Escarlata y Violeta');
    });

    it('includes ES-only series with empty name_en', async () => {
      mockHttpService.get
        .mockReturnValueOnce(of({ data: [] }))
        .mockReturnValueOnce(
          of({ data: [{ id: 'sv', name: 'Escarlata y Violeta', logo: null }] }),
        );

      const result = await service.fetchAndMergeSeries();

      expect(result[0].name_en).toBe('');
      expect(result[0].name_es).toBe('Escarlata y Violeta');
    });

    it('delegates to errorService on HTTP failure', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('network')),
      );

      await expect(service.fetchAndMergeSeries()).rejects.toThrow(
        HttpException,
      );
      expect(mockErrorService.handleApiError).toHaveBeenCalled();
    });
  });

  // ─── fetchSetsForSeries ───────────────────────────────────────────────────────

  describe('fetchSetsForSeries()', () => {
    it('returns mapped sets for a series', async () => {
      const apiSet = {
        id: 'sv1',
        name: 'Base Set',
        logo: 'https://img/sv1.png',
        symbol: 'https://img/sv1-sym.png',
        cardCount: { official: 64, total: 72 },
      };
      mockHttpService.get.mockReturnValue(of({ data: { sets: [apiSet] } }));

      const result = await service.fetchSetsForSeries('sv', 'en');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sv1');
      expect(result[0].cardCountOfficial).toBe(64);
    });

    it('validates seriesId before fetching', async () => {
      mockErrorService.validateSeriesId.mockImplementation(() => {
        throw new BadRequestException('Invalid series id');
      });

      await expect(service.fetchSetsForSeries('', 'en')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('returns empty array when API returns no sets', async () => {
      mockHttpService.get.mockReturnValue(of({ data: { sets: [] } }));

      const result = await service.fetchSetsForSeries('sv', 'en');
      expect(result).toEqual([]);
    });
  });

  // ─── fetchAndMergeSetsForSeries ───────────────────────────────────────────────

  describe('fetchAndMergeSetsForSeries()', () => {
    it('merges EN and ES sets by id', async () => {
      const enSet = {
        id: 'sv1',
        name: 'Base Set',
        logo: null,
        symbol: null,
        cardCount: { official: 64, total: 72 },
      };
      const esSet = {
        id: 'sv1',
        name: 'Set Base',
        logo: null,
        symbol: null,
        cardCount: { official: 64, total: 72 },
      };

      mockHttpService.get
        .mockReturnValueOnce(of({ data: { sets: [enSet] } }))
        .mockReturnValueOnce(of({ data: { sets: [esSet] } }));

      const result = await service.fetchAndMergeSetsForSeries('sv');

      expect(result).toHaveLength(1);
      expect(result[0].name_en).toBe('Base Set');
      expect(result[0].name_es).toBe('Set Base');
    });
  });
});
