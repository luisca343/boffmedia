import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Logger } from 'nestjs-pino';
import { TcgConfigService } from './tcg-config.service';
import { TcgImageService } from './tcg-image.service';

export interface TcgPackArtwork {
  id: string;
  name: string;
  image: string | null;
}

interface PocketDecksPack {
  id?: string;
  name?: string;
  image?: string | null;
  image_png?: string | null;
}

interface PocketDecksExpansion {
  id?: string;
  name?: string;
  total_cards?: number;
  cards_url?: string;
  packs?: PocketDecksPack[];
}

interface PocketDecksCard {
  id?: string;
  set_code?: string;
  name?: string;
  pack?: string;
  release_date?: string | null;
  type?: string;
  subtype?: string;
  stage?: string;
  health?: number | null;
  weakness?: string | null;
  attacks?: Record<
    string,
    {
      cost?: string | null;
      name?: string | null;
      damage?: number | string | null;
    }
  > | null;
  retreat?: number | null;
  card_text?: string | null;
  artist?: string | null;
  rarity?: string | null;
  shiny?: boolean;
  image?: string | null;
}

type PocketLocale = 'en' | 'es';

/**
 * Owns the complete PocketDecks fallback.
 *
 * TCGdex remains the primary source. This service is only responsible for
 * Pocket data TCGdex does not publish yet: expansions, cards, pack artwork,
 * and the localized card-image source with PocketDecks as its final fallback.
 */
@Injectable()
export class TcgPocketFallbackService {
  private readonly localizedImageBaseUrl = 'https://game.pokemontcgpocket.app';
  private readonly pocketDecksImageMarker =
    'raw.githubusercontent.com/PocketDecks/pokemon-tcg-pocket-cards/';
  private expansionCatalogPromise: Promise<PocketDecksExpansion[]> | null =
    null;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
    private readonly configService: TcgConfigService,
    private readonly imageService: TcgImageService,
  ) {}

  async getSetsForSeries(seriesId: string): Promise<any[]> {
    if (seriesId.toLowerCase() !== 'tcgp') return [];

    const catalog = await this.fetchExpansionCatalog();
    return catalog
      .map((expansion) => {
        const id = this.canonicalSetId(expansion.id);
        if (!id) return null;

        return {
          id,
          name_en: expansion.name || id,
          name_es: expansion.name || id,
          total_cards: Number(expansion.total_cards) || 0,
        };
      })
      .filter(Boolean) as any[];
  }

  async mergePackArtwork(
    setId: string,
    packs: Map<string, TcgPackArtwork>,
  ): Promise<void> {
    try {
      const catalog = await this.fetchExpansionCatalog();
      const expansion = catalog.find(
        (entry) => this.packKey(entry.id) === this.packKey(setId),
      );
      const fallbackPacks = expansion?.packs || [];
      const hadTcgDexPacks = packs.size > 0;
      const usedFallbackIds = new Set<string>();

      for (const current of packs.values()) {
        const candidate = fallbackPacks.find((fallbackPack) => {
          const fallbackId = this.packKey(fallbackPack.id);
          const image = this.getPackImage(fallbackPack);
          return (
            Boolean(image) &&
            !usedFallbackIds.has(fallbackId) &&
            (this.fallbackPackKeys(current.id).includes(fallbackId) ||
              this.packNameKey(current.name) ===
                this.packNameKey(fallbackPack.name))
          );
        });
        const imageCandidates = fallbackPacks.filter(
          (fallbackPack) =>
            this.getPackImage(fallbackPack) &&
            !usedFallbackIds.has(this.packKey(fallbackPack.id)),
        );
        const resolved =
          candidate ||
          (imageCandidates.length === 1 ? imageCandidates[0] : null);

        if (resolved) {
          const fallbackId = this.packKey(resolved.id);
          current.image ??= this.getPackImage(resolved);
          usedFallbackIds.add(fallbackId);
        }
      }

      if (!hadTcgDexPacks) {
        for (const fallbackPack of fallbackPacks) {
          const fallbackId = String(fallbackPack.id || '').trim();
          const image = this.getPackImage(fallbackPack);
          if (!fallbackId || !image) continue;

          const id = `boo_${fallbackId}`;
          packs.set(id, {
            id,
            name: String(fallbackPack.name || fallbackId),
            image,
          });
        }
      }
    } catch (error) {
      // Artwork is supplemental; a catalogue outage must not hide card data.
      this.logger.warn(
        `[TCG] Pack artwork fallback unavailable for ${setId}:`,
        error,
      );
    }
  }

  async fetchCardsForSet(
    setId: string,
    options: {
      withImages?: boolean;
      onCard?: (done: number, total: number, cardId: string) => void;
    } = {},
  ): Promise<any[]> {
    const cards = await this.fetchCardsFromCatalog(setId);
    if (cards.length === 0) return [];

    const canonicalSetId = this.canonicalSetId(setId);
    const rows: any[] = [];
    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const row = this.toCardRow(card, canonicalSetId);

      if (options.withImages !== false && card.image) {
        [row.image_local_en, row.image_local_es] = await Promise.all([
          this.downloadCardImage(card.image, row.id, canonicalSetId, 'en'),
          this.downloadCardImage(card.image, row.id, canonicalSetId, 'es'),
        ]);
      }

      rows.push(row);
      options.onCard?.(index + 1, cards.length, row.id);
    }

    return rows;
  }

  async fetchCardImageUrlsForSet(
    setId: string,
  ): Promise<Map<string, { en: string | null; es: string | null }>> {
    const cards = await this.fetchCardsFromCatalog(setId);
    const urls = new Map<string, { en: string | null; es: string | null }>();
    const canonicalSetId = this.canonicalSetId(setId);

    for (const card of cards) {
      const row = this.toCardRow(card, canonicalSetId);
      urls.set(row.id, { en: card.image || null, es: card.image || null });
    }

    return urls;
  }

  isPocketDecksImage(imageUrl: string | null | undefined): boolean {
    return Boolean(imageUrl?.includes(this.pocketDecksImageMarker));
  }

  async downloadCardImage(
    fallbackImage: string,
    cardId: string,
    setId: string,
    locale: PocketLocale,
  ): Promise<string | null> {
    const imageCandidates = this.getCardImageCandidates(
      fallbackImage,
      cardId,
      setId,
      locale,
    );

    for (const image of imageCandidates) {
      const localPath = await this.imageService.downloadCardImage(
        { image },
        cardId,
        setId,
        locale,
      );
      if (localPath) return localPath;
    }

    return null;
  }

  private getCardImageCandidates(
    fallbackImage: string,
    cardId: string,
    setId: string,
    locale: PocketLocale,
  ): string[] {
    const normalizedFallback = this.normalizeImageUrl(fallbackImage);
    if (!normalizedFallback) return [];
    if (!this.isPocketDecksImage(normalizedFallback)) {
      return [normalizedFallback];
    }

    return [
      this.getLocalizedCardImageUrl(locale, setId, cardId),
      normalizedFallback,
    ];
  }

  private getLocalizedCardImageUrl(
    locale: PocketLocale,
    setId: string,
    cardId: string,
  ): string {
    const localId = this.getLocalId(cardId);
    return `${this.localizedImageBaseUrl}/${locale}/tcgp/${setId}/${localId}/high.webp`;
  }

  private async fetchExpansionCatalog(): Promise<PocketDecksExpansion[]> {
    if (!this.expansionCatalogPromise) {
      this.expansionCatalogPromise = firstValueFrom(
        this.httpService.get(this.configService.getPackArtworkCatalogUrl()),
      )
        .then((response) => (Array.isArray(response.data) ? response.data : []))
        .catch((error) => {
          this.expansionCatalogPromise = null;
          throw error;
        });
    }

    return this.expansionCatalogPromise;
  }

  private async fetchCardsFromCatalog(
    setId: string,
  ): Promise<PocketDecksCard[]> {
    const catalog = await this.fetchExpansionCatalog();
    const expansion = catalog.find(
      (entry) =>
        this.packKey(entry.id) === this.packKey(setId) && entry.cards_url,
    );
    if (!expansion?.cards_url) return [];

    const response = await firstValueFrom(
      this.httpService.get(expansion.cards_url),
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  private toCardRow(card: PocketDecksCard, fallbackSetId: string): any {
    const setId = this.canonicalSetId(card.set_code || fallbackSetId);
    const localId =
      String(card.id || '')
        .split('-')
        .pop() || '';
    const paddedLocalId = localId.replace(/\D/g, '').padStart(3, '0');
    const cardId = `tcgp-${setId}-${paddedLocalId}`;
    const packId = `boo_${String(card.set_code || fallbackSetId).toLowerCase()}-booster`;
    const attacks = Object.values(card.attacks || {})
      .filter((attack) => attack.name)
      .map((attack) => ({
        cost: String(attack.cost || '')
          .split('')
          .filter(Boolean),
        name: attack.name,
        damage:
          attack.damage == null || attack.damage === ''
            ? ''
            : String(attack.damage),
      }));

    return {
      id: cardId,
      set_id: setId,
      local_id: paddedLocalId,
      name_en: card.name || cardId,
      name_es: card.name || cardId,
      image: card.image || null,
      image_local_en: null,
      image_local_es: null,
      category: card.type || null,
      illustrator: card.artist || null,
      rarity: card.rarity || null,
      hp: card.health ?? null,
      stage: card.stage || null,
      description_en: card.card_text || null,
      description_es: card.card_text || null,
      updated: card.release_date ? new Date(card.release_date) : null,
      types: this.safeStringify(card.subtype ? [card.subtype] : []),
      weaknesses: this.safeStringify(
        card.weakness ? [{ type: card.weakness, value: '+20' }] : [],
      ),
      attacks: this.safeStringify(attacks),
      boosters: this.safeStringify([
        { id: packId, name: card.pack || 'Booster' },
      ]),
      variants: this.safeStringify({
        firstEdition: false,
        holo: Boolean(card.shiny),
        normal: true,
        reverse: false,
        wPromo: false,
      }),
      legal: this.safeStringify({ standard: true, expanded: true }),
      retreat: card.retreat ?? null,
    };
  }

  private canonicalSetId(value: string | null | undefined): string {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const promo = raw.match(/^p[-_]?([ab])$/i);
    if (promo) return `P-${promo[1].toUpperCase()}`;

    const set = raw.match(/^([ab])(\d+)([a-z])?$/i);
    if (set) return `${set[1].toUpperCase()}${set[2]}${set[3] || ''}`;

    return raw;
  }

  private getLocalId(cardId: string): string {
    const localId = String(cardId).split('-').pop() || '';
    return localId.replace(/\D/g, '').padStart(3, '0');
  }

  private normalizeImageUrl(
    imageUrl: string | null | undefined,
  ): string | null {
    const value = String(imageUrl || '').trim();
    if (!value) return null;
    return /\.(?:webp|png)(?:[?#].*)?$/i.test(value)
      ? value
      : `${value}/high.webp`;
  }

  private packKey(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^boo_/, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private packNameKey(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private fallbackPackKeys(value: string | null | undefined): string[] {
    const key = this.packKey(value);
    const keys = [key];
    const promo = key.match(/^(pa|pb)vol(\d+)$/);
    if (promo) keys.push(`${promo[1]}promov${promo[2]}`);
    return keys;
  }

  private getPackImage(pack: PocketDecksPack): string | null {
    if (pack.image || pack.image_png)
      return pack.image || pack.image_png || null;

    const id = String(pack.id || '')
      .trim()
      .toLowerCase();
    if (/^(pa|pb)-promov\d+$/.test(id)) {
      return this.configService.getPackArtworkImageUrl(id);
    }

    return null;
  }

  private safeStringify(data: any): string | null {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    if (typeof data === 'object' && Object.keys(data).length === 0) return null;
    return JSON.stringify(data);
  }
}
