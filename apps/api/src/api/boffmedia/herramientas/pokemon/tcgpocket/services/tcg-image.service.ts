import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { publicPath } from '@/config/paths';
import { ASSET } from '@boffmedia/asset-paths';
import type { TcgPackArtwork } from './tcg-fetch.service';

// The URL prefix that serves what we write. `apps/web/public` is a symlink to
// the repo's `public/`, so a file written to publicPath('boffmedia','tools',
// 'tcg', ...) is served at `/boffmedia/tools/tcg/...`. These used to return
// `/img/games/tcg/...`, a path that stopped existing in the public/ reorg —
// the files downloaded fine and every stored URL pointed at nothing, which is
// why no card art rendered.
const TCG_URL = ASSET.boffmedia.tools.tcg;
const IMAGE_RETRY_DELAYS_MS = [300, 900, 2_000];
const IMAGE_REQUEST_MIN_INTERVAL_MS = 100;

@Injectable()
export class TcgImageService {
  private lastImageRequestAt = 0;

  constructor(private readonly logger: Logger) {}

  /**
   * Downloads the single pack image used by the Pocket UI into the same
   * runtime asset tree as cards and sets.
   */
  async downloadPackImages(
    packs: TcgPackArtwork[],
    setId: string,
    force = false,
  ): Promise<{
    downloaded: number;
    updated: number;
    skipped: number;
    failed: number;
  }> {
    const counts = { downloaded: 0, updated: 0, skipped: 0, failed: 0 };
    const packImgDir = publicPath('boffmedia', 'tools', 'tcg', 'packs', setId);
    await fs.mkdir(packImgDir, { recursive: true });

    const seen = new Set<string>();
    for (const pack of packs || []) {
      const packId = this.safeAssetName(pack.id || pack.name);
      if (!packId || seen.has(packId)) continue;
      seen.add(packId);

      const assets = [{ url: pack.image, suffix: '' }].filter((asset) =>
        Boolean(asset.url),
      );

      if (assets.length === 0) {
        counts.skipped += 1;
        continue;
      }

      for (const asset of assets) {
        const filename = `${packId}${asset.suffix}.webp`;
        const imageFilename = path.join(packImgDir, filename);

        if (!force && (await this.fileExists(imageFilename))) {
          counts.skipped += 1;
          continue;
        }

        try {
          const response = await this.downloadImage(this.toWebpUrl(asset.url!));
          await fs.writeFile(imageFilename, response.data);
          counts.downloaded += 1;
        } catch (err: any) {
          counts.failed += 1;
          this.logger.warn(
            `[TCG] Failed to download ${asset.suffix || 'front'} artwork for pack ${pack.id} in set ${setId}:`,
            err,
          );
        }
      }
    }

    return counts;
  }

  async downloadSetImages(sets: any[]): Promise<void> {
    for (const set of sets) {
      const setImgDir = publicPath('boffmedia', 'tools', 'tcg', 'sets', set.id);
      await fs.mkdir(setImgDir, { recursive: true });

      // Download logo
      if (set.logo) {
        try {
          const logoUrl = set.logo + '.webp';
          const logoFilename = path.join(setImgDir, 'logo.webp');
          const response = await this.downloadImage(logoUrl);
          await fs.writeFile(logoFilename, response.data);
          // Store path WITHOUT /public prefix
          set.logo_local = `${TCG_URL}/sets/${set.id}/logo.webp`;
        } catch (err: any) {
          this.logger.warn(
            `[TCG] Failed to download logo for set ${set.id}:`,
            err,
          );
          set.logo_local = null;
        }
      }

      // Download symbol
      if (set.symbol) {
        try {
          const symbolUrl = set.symbol + '.webp';
          const symbolFilename = path.join(setImgDir, 'symbol.webp');
          const response = await this.downloadImage(symbolUrl);
          await fs.writeFile(symbolFilename, response.data);
          // Store path WITHOUT /public prefix
          set.symbol_local = `${TCG_URL}/sets/${set.id}/symbol.webp`;
        } catch (err: any) {
          this.logger.warn(
            `[TCG] Failed to download symbol for set ${set.id}:`,
            err,
          );
          set.symbol_local = null;
        }
      }
    }
  }

  async downloadCardImage(
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

      return `${TCG_URL}/cards/${setId}/${cardId}_${locale}.webp`;
    } catch (err: any) {
      this.logger.warn(
        `[TCG] Failed to download ${locale} image for card ${cardId}:`,
        err,
      );
      return null;
    }
  }

  async downloadCardImageIfNotExists(
    cardData: any,
    cardId: string,
    setId: string,
    locale: string,
    existingImagePath?: string,
  ): Promise<string | null> {
    // If image already exists in DB, return it
    if (existingImagePath) {
      this.logger.log(
        `[TCG] ${locale.toUpperCase()} image for card ${cardId} already exists: ${existingImagePath}`,
      );
      return existingImagePath;
    }

    // Download new image
    const imagePath = await this.downloadCardImage(
      cardData,
      cardId,
      setId,
      locale,
    );
    if (imagePath) {
      this.logger.log(
        `[TCG] ${locale.toUpperCase()} image downloaded for card ${cardId}: ${imagePath}`,
      );
    }

    return imagePath;
  }

  async downloadImagesForCards(
    cards: any[],
    setId: string,
    existingCardsMap?: Map<string, any>,
  ): Promise<void> {
    for (const card of cards) {
      const existingCard = existingCardsMap?.get(card.id);

      // Download EN image if not exists
      if (!card.image_local_en) {
        card.image_local_en = await this.downloadCardImageIfNotExists(
          { image: card.image },
          card.id,
          setId,
          'en',
          existingCard?.image_local_en,
        );
      }

      // Download ES image if not exists
      if (!card.image_local_es) {
        card.image_local_es = await this.downloadCardImageIfNotExists(
          { image: card.image },
          card.id,
          setId,
          'es',
          existingCard?.image_local_es,
        );
      }
    }
  }

  private async fileExists(filename: string): Promise<boolean> {
    try {
      await fs.access(filename);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * TCGdex assets are served by a CDN and a large set can hit a transient
   * 429/5xx response after hundreds of requests. Retry only statuses that are
   * safe to retry; a 404 remains a genuine missing asset.
   */
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

  private toWebpUrl(url: string): string {
    return /\.(?:png|jpe?g|webp)(?:[?#].*)?$/i.test(url) ? url : `${url}.webp`;
  }

  private safeAssetName(value: string | null | undefined): string {
    return String(value || '')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '_');
  }
}
