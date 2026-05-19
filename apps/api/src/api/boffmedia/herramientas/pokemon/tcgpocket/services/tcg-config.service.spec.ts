import { Test, TestingModule } from '@nestjs/testing';
import { TcgConfigService } from './tcg-config.service';

describe('TcgConfigService', () => {
  let service: TcgConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TcgConfigService],
    }).compile();

    service = module.get<TcgConfigService>(TcgConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApiUrl()', () => {
    it('builds a URL from locale and endpoint', () => {
      expect(service.getApiUrl('en', 'series')).toBe(
        'https://api.tcgdex.net/v2/en/series',
      );
    });

    it('throws for unsupported locale', () => {
      expect(() => service.getApiUrl('fr', 'series')).toThrow(
        'Unsupported locale',
      );
    });
  });

  describe('getSeriesUrl()', () => {
    it('returns the series endpoint URL', () => {
      expect(service.getSeriesUrl('es')).toBe(
        'https://api.tcgdex.net/v2/es/series',
      );
    });
  });

  describe('getSeriesDetailUrl()', () => {
    it('includes the series id in the path', () => {
      expect(service.getSeriesDetailUrl('en', 'sv')).toBe(
        'https://api.tcgdex.net/v2/en/series/sv',
      );
    });
  });

  describe('getSetUrl()', () => {
    it('builds the set URL', () => {
      expect(service.getSetUrl('en', 'sv1')).toBe(
        'https://api.tcgdex.net/v2/en/sets/sv1',
      );
    });
  });

  describe('getCardUrl()', () => {
    it('builds the card URL', () => {
      expect(service.getCardUrl('en', 'sv1-1')).toBe(
        'https://api.tcgdex.net/v2/en/cards/sv1-1',
      );
    });
  });

  describe('getSupportedLocales()', () => {
    it('returns a copy of the supported locales array', () => {
      const locales = service.getSupportedLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('es');
    });
  });

  describe('getDefaultLocale()', () => {
    it('returns "en"', () => {
      expect(service.getDefaultLocale()).toBe('en');
    });
  });

  describe('isValidLocale()', () => {
    it('returns true for supported locales', () => {
      expect(service.isValidLocale('en')).toBe(true);
      expect(service.isValidLocale('es')).toBe(true);
    });

    it('returns false for unsupported locales', () => {
      expect(service.isValidLocale('fr')).toBe(false);
      expect(service.isValidLocale('')).toBe(false);
    });
  });

  describe('getMaxRetries()', () => {
    it('returns a positive number', () => {
      expect(service.getMaxRetries()).toBeGreaterThan(0);
    });
  });

  describe('getRetryDelay()', () => {
    it('returns a positive number', () => {
      expect(service.getRetryDelay()).toBeGreaterThan(0);
    });
  });
});
