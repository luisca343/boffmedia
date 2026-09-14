import { Injectable } from '@nestjs/common';

@Injectable()
export class TcgConfigService {
  private readonly baseApiUrl = 'https://api.tcgdex.net/v2';
  private readonly packArtworkCatalogUrl =
    'https://raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/refs/heads/main/data/v5/expansions.json';
  private readonly packArtworkImageBaseUrl =
    'https://raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/refs/heads/main/images/webp/packs';
  private readonly supportedLocales = ['en', 'es'];
  private readonly defaultLocale = 'en';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  getApiUrl(locale: string, endpoint: string): string {
    this.validateLocale(locale);
    return `${this.baseApiUrl}/${locale}/${endpoint}`;
  }

  getSeriesUrl(locale: string): string {
    return this.getApiUrl(locale, 'series');
  }

  getSeriesDetailUrl(locale: string, seriesId: string): string {
    return this.getApiUrl(locale, `series/${seriesId}`);
  }

  getSetUrl(locale: string, setId: string): string {
    return this.getApiUrl(locale, `sets/${setId}`);
  }

  getCardUrl(locale: string, cardId: string): string {
    return this.getApiUrl(locale, `cards/${cardId}`);
  }

  /**
   * TCGdex currently publishes TCG Pocket booster ids/names without artwork
   * URLs. This catalogue is the image-backed fallback for those boosters.
   */
  getPackArtworkCatalogUrl(): string {
    return this.packArtworkCatalogUrl;
  }

  getPackArtworkImageUrl(packId: string): string {
    return `${this.packArtworkImageBaseUrl}/${packId}.webp`;
  }

  getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  getMaxRetries(): number {
    return this.maxRetries;
  }

  getRetryDelay(): number {
    return this.retryDelay;
  }

  private validateLocale(locale: string): void {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(
        `Unsupported locale: ${locale}. Supported: ${this.supportedLocales.join(', ')}`,
      );
    }
  }

  isValidLocale(locale: string): boolean {
    return this.supportedLocales.includes(locale);
  }
}
