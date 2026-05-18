import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { TcgImageService } from './tcg-image.service';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('axios', () => ({
  default: {
    get: jest.fn().mockResolvedValue({ data: Buffer.from('img') }),
  },
  get: jest.fn().mockResolvedValue({ data: Buffer.from('img') }),
}));

import { promises as fs } from 'fs';
import axios from 'axios';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('TcgImageService', () => {
  let service: TcgImageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (axios.get as jest.Mock).mockResolvedValue({ data: Buffer.from('img') });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcgImageService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TcgImageService>(TcgImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── downloadSetImages ────────────────────────────────────────────────────────

  describe('downloadSetImages()', () => {
    it('creates the set directory and downloads logo and symbol', async () => {
      const sets: any[] = [{ id: 'sv1', logo: 'https://cdn/sv1', symbol: 'https://cdn/sv1-sym' }];

      await service.downloadSetImages(sets);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      expect(sets[0].logo_local).toBe('/img/games/tcg/sets/sv1/logo.webp');
      expect(sets[0].symbol_local).toBe('/img/games/tcg/sets/sv1/symbol.webp');
    });

    it('sets logo_local to null when logo download fails', async () => {
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error('network'));
      const sets: any[] = [{ id: 'sv1', logo: 'https://cdn/sv1', symbol: null }];

      await service.downloadSetImages(sets);

      expect(sets[0].logo_local).toBeNull();
    });

    it('skips download when logo is falsy', async () => {
      const sets: any[] = [{ id: 'sv1', logo: null, symbol: null }];

      await service.downloadSetImages(sets);

      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // ─── downloadCardImage ────────────────────────────────────────────────────────

  describe('downloadCardImage()', () => {
    it('returns null when card has no image', async () => {
      const result = await service.downloadCardImage({}, 'sv1-1', 'sv1', 'en');
      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('downloads and returns the local path', async () => {
      const result = await service.downloadCardImage(
        { image: 'https://cdn/sv1-1' },
        'sv1-1',
        'sv1',
        'en',
      );

      expect(result).toBe('/img/games/tcg/cards/sv1/sv1-1_en.webp');
      expect(axios.get).toHaveBeenCalledWith('https://cdn/sv1-1/high.webp', { responseType: 'arraybuffer' });
    });

    it('returns null and warns on download failure', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('network'));

      const result = await service.downloadCardImage(
        { image: 'https://cdn/sv1-1' },
        'sv1-1',
        'sv1',
        'en',
      );

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  // ─── downloadCardImageIfNotExists ─────────────────────────────────────────────

  describe('downloadCardImageIfNotExists()', () => {
    it('returns existing path without downloading', async () => {
      const result = await service.downloadCardImageIfNotExists(
        { image: 'https://cdn/sv1-1' },
        'sv1-1',
        'sv1',
        'en',
        '/img/games/tcg/cards/sv1/sv1-1_en.webp',
      );

      expect(result).toBe('/img/games/tcg/cards/sv1/sv1-1_en.webp');
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('downloads when no existing path provided', async () => {
      const result = await service.downloadCardImageIfNotExists(
        { image: 'https://cdn/sv1-1' },
        'sv1-1',
        'sv1',
        'en',
      );

      expect(result).toBe('/img/games/tcg/cards/sv1/sv1-1_en.webp');
    });
  });

  // ─── downloadImagesForCards ───────────────────────────────────────────────────

  describe('downloadImagesForCards()', () => {
    it('downloads EN and ES images for each card', async () => {
      const cards = [{ id: 'sv1-1', image: 'https://cdn/sv1-1', image_local_en: null, image_local_es: null }];

      await service.downloadImagesForCards(cards, 'sv1');

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(cards[0].image_local_en).toBe('/img/games/tcg/cards/sv1/sv1-1_en.webp');
      expect(cards[0].image_local_es).toBe('/img/games/tcg/cards/sv1/sv1-1_es.webp');
    });

    it('skips download when image already set on card', async () => {
      const cards = [
        {
          id: 'sv1-1',
          image: 'https://cdn/sv1-1',
          image_local_en: '/img/games/tcg/cards/sv1/sv1-1_en.webp',
          image_local_es: '/img/games/tcg/cards/sv1/sv1-1_es.webp',
        },
      ];

      await service.downloadImagesForCards(cards, 'sv1');

      expect(axios.get).not.toHaveBeenCalled();
    });

    it('uses existing DB paths when existingCardsMap is provided', async () => {
      const cards = [{ id: 'sv1-1', image: 'https://cdn/sv1-1', image_local_en: null, image_local_es: null }];
      const existingCardsMap = new Map([
        ['sv1-1', { image_local_en: '/cached/en.webp', image_local_es: '/cached/es.webp' }],
      ]);

      await service.downloadImagesForCards(cards, 'sv1', existingCardsMap);

      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
