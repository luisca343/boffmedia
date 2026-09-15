import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TcgSeriesDto } from '../dto/tcg-series.dto';
import { TcgErrorService } from './tcg-error.service';
import { TcgConfigService } from './tcg-config.service';
import {
  TcgPocketFallbackService,
  type TcgPackArtwork,
} from './tcg-pocket-fallback.service';
import { Logger } from 'nestjs-pino';
import { publicPath } from '@/config/paths';
import { ASSET } from '@boffmedia/asset-paths';

const IMAGE_RETRY_DELAYS_MS = [300, 900, 2_000];
const IMAGE_REQUEST_MIN_INTERVAL_MS = 100;

@Injectable()
export class TcgFetchService {
  constructor(
    private readonly logger: Logger,

    private readonly httpService: HttpService,
    private readonly errorService: TcgErrorService,
    private readonly configService: TcgConfigService,
    private readonly pocketFallbackService: TcgPocketFallbackService,
  ) {}

  private lastImageRequestAt = 0;

  // ==================== SERIES FETCHING ====================

  async fetchAndMergeSeries(): Promise<TcgSeriesDto[]> {
    try {
      // Fetch EN and ES series in parallel
      const [enRes, esRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get(this.configService.getSeriesUrl('en')),
        ),
        firstValueFrom(
          this.httpService.get(this.configService.getSeriesUrl('es')),
        ),
      ]);

      const enSeries = enRes.data;
      const esSeries = esRes.data;

      // Merge by id
      const seriesMap = new Map<string, TcgSeriesDto>();

      enSeries.forEach((s: any) => {
        seriesMap.set(s.id, {
          id: s.id,
          name_en: s.name,
          name_es: '',
          logo: s.logo || null,
        });
      });

      esSeries.forEach((s: any) => {
        if (seriesMap.has(s.id)) {
          seriesMap.get(s.id)!.name_es = s.name;
        } else {
          seriesMap.set(s.id, {
            id: s.id,
            name_en: '',
            name_es: s.name,
            logo: s.logo || null,
          });
        }
      });

      return Array.from(seriesMap.values());
    } catch (error: any) {
      this.errorService.handleApiError(error, 'Fetch and merge series');
    }
  }

  // ==================== SETS FETCHING ====================

  async fetchSetsForSeries(
    seriesId: string,
    locale: string = 'en',
  ): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);
      this.errorService.validateLocale(locale);

      const url = this.configService.getSeriesDetailUrl(locale, seriesId);
      const response = await firstValueFrom(this.httpService.get(url));
      const sets = response.data.sets || [];

      return sets.map((set: any) => ({
        id: set.id,
        name: set.name,
        logo: set.logo,
        symbol: set.symbol,
        cardCountOfficial: set.cardCount?.official ?? 0,
        cardCountTotal: set.cardCount?.total ?? 0,
      }));
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch sets for series');
    }
  }

  async fetchAndMergeSetsForSeries(seriesId: string): Promise<any[]> {
    try {
      this.errorService.validateSeriesId(seriesId);

      // Fetch EN and ES sets in parallel
      const [enRes, esRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get(
            this.configService.getSeriesDetailUrl('en', seriesId),
          ),
        ),
        firstValueFrom(
          this.httpService.get(
            this.configService.getSeriesDetailUrl('es', seriesId),
          ),
        ),
      ]);

      const enSets = enRes.data.sets || [];
      const esSets = esRes.data.sets || [];

      // Merge by set id
      const setMap = new Map<string, any>();

      enSets.forEach((set: any) => {
        setMap.set(set.id, {
          id: set.id,
          series_id: seriesId,
          name_en: set.name,
          name_es: '',
          logo: set.logo,
          symbol: set.symbol,
          card_count_official: set.cardCount?.official ?? 0,
          card_count_total: set.cardCount?.total ?? 0,
        });
      });

      esSets.forEach((set: any) => {
        if (setMap.has(set.id)) {
          setMap.get(set.id).name_es = set.name;
        } else {
          setMap.set(set.id, {
            id: set.id,
            series_id: seriesId,
            name_en: '',
            name_es: set.name,
            logo: set.logo,
            symbol: set.symbol,
            card_count_official: set.cardCount?.official ?? 0,
            card_count_total: set.cardCount?.total ?? 0,
          });
        }
      });

      if (seriesId.toLowerCase() === 'tcgp') {
        const fallbackSets = await this.pocketFallbackService
          .getSetsForSeries(seriesId)
          .catch((error) => {
            this.logger.warn(
              `[TCG] Pocket expansion catalogue unavailable: ${error}`,
            );
            return [];
          });

        for (const expansion of fallbackSets) {
          if (!expansion.id || setMap.has(expansion.id)) continue;

          setMap.set(expansion.id, {
            id: expansion.id,
            series_id: seriesId,
            name_en: expansion.name_en || expansion.id,
            name_es: expansion.name_es || expansion.id,
            logo: null,
            symbol: null,
            card_count_official: 0,
            card_count_total: Number(expansion.total_cards) || 0,
          });
        }
      }

      return Array.from(setMap.values());
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(
        error,
        'Fetch and merge sets for series',
      );
    }
  }

  /**
   * Fetches the booster catalogue for a set in both locales.
   *
   * Booster artwork is only present on the full set/card payload, not on the
   * series set briefs used by the sync status screen. Keep this as a separate
   * request so checking sync status does not turn into one request per set.
   *
   * TCGdex currently returns only `id`/`name` for TCG Pocket boosters. When
   * that happens, fill the missing front artwork from the image-backed
   * Pocket Decks expansion catalogue. The TCGdex booster id remains the
   * canonical id used by cards and by our local filenames.
   */
  async fetchPackArtworkForSet(setId: string): Promise<TcgPackArtwork[]> {
    try {
      this.errorService.validateSetId(setId);

      const [enRes, esRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get(this.configService.getSetUrl('en', setId)),
        ).catch((error: any) => {
          if (this.isNotFound(error)) return null;
          throw error;
        }),
        firstValueFrom(
          this.httpService.get(this.configService.getSetUrl('es', setId)),
        ).catch((error: any) => {
          if (this.isNotFound(error)) return null;
          throw error;
        }),
      ]);

      const packs = new Map<string, TcgPackArtwork>();
      for (const [locale, response] of [
        ['en', enRes] as const,
        ['es', esRes] as const,
      ]) {
        for (const booster of response?.data?.boosters || []) {
          const id = String(booster?.id ?? booster?.name ?? '').trim();
          if (!id) continue;

          const current = packs.get(id) ?? {
            id,
            name: '',
            image: null,
          };

          if (locale === 'en' || !current.name) {
            current.name = String(booster?.name ?? id);
          }
          current.image =
            current.image ??
            booster?.image ??
            booster?.artwork_front ??
            booster?.artworkFront ??
            null;
          packs.set(id, current);
        }
      }

      const resolved = Array.from(packs.values());
      if (resolved.length === 0 || resolved.some((pack) => !pack.image)) {
        await this.pocketFallbackService.mergePackArtwork(setId, packs);
      }

      return Array.from(packs.values());
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch pack artwork for set');
    }
  }

  private isNotFound(error: any): boolean {
    return (
      error?.response?.status === 404 ||
      error?.status === 404 ||
      error?.statusCode === 404
    );
  }

  // ==================== CARDS FETCHING ====================

  async fetchCardsForSet(setId: string, locale: string = 'en'): Promise<any[]> {
    try {
      this.errorService.validateSetId(setId);
      this.errorService.validateLocale(locale);

      // Fetch CardBriefs for the given locale
      let setRes: any;
      try {
        setRes = await firstValueFrom(
          this.httpService.get(this.configService.getSetUrl(locale, setId)),
        );
      } catch (error: any) {
        if (!this.isNotFound(error)) throw error;
        const fallback = await this.pocketFallbackService.fetchCardsForSet(
          setId,
          { withImages: false },
        );
        if (fallback.length > 0) return fallback;
        throw error;
      }
      const cards = setRes.data.cards || [];
      const mergedCards: any[] = [];

      for (const card of cards) {
        this.logger.log(
          `Fetching card ${card.id} for set ${setId} in locale ${locale}`,
        );
        // Fetch full card data
        const cardRes = await firstValueFrom(
          this.httpService.get(this.configService.getCardUrl(locale, card.id)),
        );
        const cardData = cardRes.data;

        // Build card object (only for the requested language)
        const merged = {
          id: card.id,
          set_id: setId,
          local_id: card.localId,
          name_en: locale === 'en' ? cardData.name : '',
          name_es: locale === 'es' ? cardData.name : '',
          image_local_en: null,
          image_local_es: null,
          category: cardData.category,
          illustrator: cardData.illustrator,
          rarity: cardData.rarity,
          hp: cardData.hp ?? null,
          stage: cardData.stage,
          description_en: locale === 'en' ? cardData.description : '',
          description_es: locale === 'es' ? cardData.description : '',
          updated: cardData.updated ? new Date(cardData.updated) : null,

          // New complex fields as JSON strings
          types: this.safeStringify(cardData.types),
          weaknesses: this.safeStringify(cardData.weaknesses),
          attacks: this.safeStringify(cardData.attacks),
          boosters: this.safeStringify(cardData.boosters),
          variants: this.safeStringify(cardData.variants),
          legal: this.safeStringify(cardData.legal),
          retreat: cardData.retreat ?? null,
        };

        mergedCards.push(merged);

        // Rate limit: wait 250ms between requests
        await new Promise((res) => setTimeout(res, 250));
      }

      return mergedCards;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch cards for set');
    }
  }

  /**
   * Full card data for one set, both locales merged.
   *
   * `withImages` defaults to true so the legacy "fetch everything" endpoints keep
   * behaving as they always did, but the selective sync passes `false`: artwork is
   * its own stage there, so an admin can refresh card text without re-pulling
   * hundreds of megabytes of images. `onCard` reports progress per card so the
   * stream can show which card a long set is on.
   */
  async fetchAndMergeCardsForSet(
    setId: string,
    opts: {
      withImages?: boolean;
      onCard?: (done: number, total: number, cardId: string) => void;
    } = {},
  ): Promise<any[]> {
    const withImages = opts.withImages !== false;
    try {
      this.errorService.validateSetId(setId);

      // Fetch EN first (always available)
      let enSetRes: any;
      try {
        enSetRes = await firstValueFrom(
          this.httpService.get(this.configService.getSetUrl('en', setId)),
        );
      } catch (error: any) {
        if (!this.isNotFound(error)) throw error;
        const fallback = await this.pocketFallbackService.fetchCardsForSet(
          setId,
          { withImages, onCard: opts.onCard },
        );
        if (fallback.length > 0) return fallback;
        throw error;
      }
      const enCards = enSetRes.data.cards || [];

      if (enCards.length === 0) {
        const fallback = await this.pocketFallbackService.fetchCardsForSet(
          setId,
          { withImages, onCard: opts.onCard },
        );
        if (fallback.length > 0) return fallback;
      }

      // Try to fetch ES, but handle gracefully if it doesn't exist
      let esCards = [];
      try {
        const esSetRes = await firstValueFrom(
          this.httpService.get(this.configService.getSetUrl('es', setId)),
        );
        esCards = esSetRes.data.cards || [];
        this.logger.log(`[TCG] Successfully fetched ES cards for set ${setId}`);
      } catch (esError) {
        if ((esError as any).response?.status === 404) {
          this.logger.warn(
            `[TCG] ES locale not available for set ${setId}, proceeding with EN only`,
          );
          esCards = [];
        } else {
          // Re-throw if it's not a 404 error
          throw esError;
        }
      }

      // Merge CardBriefs by id
      const cardBriefMap = new Map<string, any>();

      enCards.forEach((card: any) => {
        cardBriefMap.set(card.id, {
          id: card.id,
          set_id: setId,
          local_id: card.localId,
          name_en: card.name,
          name_es: '',
          image: card.image,
        });
      });

      esCards.forEach((card: any) => {
        if (cardBriefMap.has(card.id)) {
          cardBriefMap.get(card.id).name_es = card.name;
        } else {
          cardBriefMap.set(card.id, {
            id: card.id,
            set_id: setId,
            local_id: card.localId,
            name_en: '',
            name_es: card.name,
            image: card.image,
          });
        }
      });

      const mergedBriefs = Array.from(cardBriefMap.values());
      const mergedCards: any[] = [];

      this.logger.log(
        `[TCG] Starting detailed card fetching for ${mergedBriefs.length} cards in set ${setId}`,
      );

      for (let i = 0; i < mergedBriefs.length; i++) {
        const brief = mergedBriefs[i];
        this.logger.log(
          `[TCG] Fetching detailed data for card ${i + 1}/${mergedBriefs.length}: ${brief.id} in set ${setId}`,
        );

        // Fetch EN card data (always available)
        const enCardRes = await firstValueFrom(
          this.httpService.get(this.configService.getCardUrl('en', brief.id)),
        );
        const enCard = enCardRes.data;

        // Try to fetch ES card data, but handle gracefully if it doesn't exist
        let esCard = null;
        try {
          const esCardRes = await firstValueFrom(
            this.httpService.get(this.configService.getCardUrl('es', brief.id)),
          );
          esCard = esCardRes.data;
        } catch (esCardError) {
          if ((esCardError as any).response?.status === 404) {
            this.logger.warn(
              `[TCG] ES version not available for card ${brief.id}, using EN description`,
            );
            esCard = enCard; // Use EN data as fallback
          } else {
            // For other errors, still use EN as fallback but log the error
            this.logger.warn(
              `[TCG] Error fetching ES version for card ${brief.id}:`,
              (esCardError as Error).message,
            );
            esCard = enCard;
          }
        }

        // Artwork only when this call owns it (see `withImages` above).
        const [imageLocalEn, imageLocalEs] = withImages
          ? await Promise.all([
              this.downloadCardImage(
                { image: enCard.image },
                brief.id,
                setId,
                'en',
              ),
              this.downloadCardImage(
                { image: esCard?.image },
                brief.id,
                setId,
                'es',
              ),
            ])
          : [null, null];

        // Merge card data with local image paths
        const merged = {
          id: brief.id,
          set_id: setId,
          local_id: brief.local_id,
          name_en: brief.name_en || enCard.name,
          name_es: brief.name_es || (esCard ? esCard.name : enCard.name),
          image_local_en: imageLocalEn,
          image_local_es: imageLocalEs,
          category: enCard.category,
          illustrator: enCard.illustrator,
          rarity: enCard.rarity,
          hp: enCard.hp ?? null,
          stage: enCard.stage,
          description_en: enCard.description,
          description_es: esCard ? esCard.description : enCard.description,
          updated: enCard.updated ? new Date(enCard.updated) : null,

          // New complex fields as JSON strings
          types: this.safeStringify(enCard.types),
          weaknesses: this.safeStringify(enCard.weaknesses),
          attacks: this.safeStringify(enCard.attacks),
          boosters: this.safeStringify(enCard.boosters ?? esCard?.boosters),
          variants: this.safeStringify(enCard.variants),
          legal: this.safeStringify(enCard.legal),
          retreat: enCard.retreat ?? null,
        };

        mergedCards.push(merged);
        opts.onCard?.(i + 1, mergedBriefs.length, brief.id);

        // Rate limit: wait 250ms between requests
        await new Promise((res) => setTimeout(res, 250));
      }

      this.logger.log(
        `[TCG] Completed detailed card fetching for set ${setId}`,
      );
      return mergedCards;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.errorService.handleApiError(error, 'Fetch and merge cards for set');
    }
  }

  /**
   * Remote artwork base URLs for every card of a set, per locale.
   *
   * The card rows only keep the LOCAL path, so the images stage cannot know
   * where to re-download from. One brief request per locale answers it for the
   * whole set — far cheaper than re-fetching each card's detail endpoint.
   */
  async fetchCardImageUrlsForSet(
    setId: string,
  ): Promise<Map<string, { en: string | null; es: string | null }>> {
    this.errorService.validateSetId(setId);
    const urls = new Map<string, { en: string | null; es: string | null }>();

    let enRes: any;
    try {
      enRes = await firstValueFrom(
        this.httpService.get(this.configService.getSetUrl('en', setId)),
      );
    } catch (error: any) {
      if (!this.isNotFound(error)) throw error;
      return this.pocketFallbackService.fetchCardImageUrlsForSet(setId);
    }

    if (!enRes.data.cards?.length) {
      const fallback =
        await this.pocketFallbackService.fetchCardImageUrlsForSet(setId);
      if (fallback.size > 0) return fallback;
    }
    for (const card of enRes.data.cards || []) {
      urls.set(card.id, { en: card.image ?? null, es: null });
    }

    try {
      const esRes = await firstValueFrom(
        this.httpService.get(this.configService.getSetUrl('es', setId)),
      );
      for (const card of esRes.data.cards || []) {
        const entry = urls.get(card.id);
        if (entry) entry.es = card.image ?? null;
        else urls.set(card.id, { en: null, es: card.image ?? null });
      }
    } catch (esError) {
      if ((esError as any).response?.status !== 404) throw esError;
      this.logger.warn(
        `[TCG] ES locale not available for set ${setId}, images will be EN only`,
      );
    }

    return urls;
  }

  // Add this helper method to the TcgFetchService class
  private async downloadCardImage(
    cardData: any,
    cardId: string,
    setId: string,
    locale: string,
  ): Promise<string | null> {
    if (!cardData.image) return null;

    try {
      this.logger.log(
        `[TCG] Downloading ${locale.toUpperCase()} image for card ${cardId}...`,
      );
      const cardImgDir = publicPath(
        'boffmedia',
        'tools',
        'tcg',
        'cards',
        setId,
      );
      await fs.mkdir(cardImgDir, { recursive: true });

      const imageUrl = cardData.image + '/high.webp';
      const imageFilename = path.join(cardImgDir, `${cardId}_${locale}.webp`);

      const response = await this.downloadImage(imageUrl);
      await fs.writeFile(imageFilename, response.data);

      return `${ASSET.boffmedia.tools.tcg}/cards/${setId}/${cardId}_${locale}.webp`;
    } catch (err: any) {
      this.logger.warn(
        `[TCG] Failed to download ${locale} image for card ${cardId}:`,
        err,
      );
      return null;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async downloadImage(url: string): Promise<{ data: any }> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        await this.waitForImageSlot();
        return await axios.get(url, { responseType: 'arraybuffer' });
      } catch (error: any) {
        if (
          attempt >= IMAGE_RETRY_DELAYS_MS.length ||
          !this.isRetryableImageError(error)
        ) {
          throw error;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, this.getRetryDelay(error, attempt)),
        );
      }
    }
  }

  private async waitForImageSlot(): Promise<void> {
    const elapsed = Date.now() - this.lastImageRequestAt;
    const wait = IMAGE_REQUEST_MIN_INTERVAL_MS - elapsed;
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastImageRequestAt = Date.now();
  }

  private isRetryableImageError(error: any): boolean {
    const status = error?.response?.status;
    return (
      !status ||
      status === 408 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }

  private getRetryDelay(error: any, attempt: number): number {
    const retryAfter = error?.response?.headers?.['retry-after'];
    const retryAfterSeconds = Number(retryAfter);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1_000, 10_000);
    }

    return IMAGE_RETRY_DELAYS_MS[attempt];
  }

  private safeStringify(data: any): string | null {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    if (typeof data === 'object' && Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }
}
