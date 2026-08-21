import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, readdir, stat, writeFile } from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import {
  LocalMangaChapter,
  LocalMangaLibrary,
  LocalMangaSeries,
} from './manga.types';
import { MANGA_ROOT } from './manga-constants';

/** What an archive looked like when its images were last counted. */
interface CountedArchive {
  size: number;
  mtimeMs: number;
  imageCount: number;
}

@Injectable()
export class MangaLibraryService {
  private readonly logger = new Logger(MangaLibraryService.name);

  // Counting images means opening the archive, and adm-zip reads the whole file
  // into memory. The library lives on network storage, so listing it that way
  // pulls every chapter across the wire on every page load — which is why the
  // request used to run for minutes and be abandoned by the client. A `stat` is
  // one round trip instead, and only an archive whose size or mtime moved is
  // opened again.
  private readonly INDEX_PATH = path.join(
    process.cwd(),
    'var/cache/manga-library-index.json',
  );
  private index: Record<string, CountedArchive> | null = null;

  private async loadIndex(): Promise<Record<string, CountedArchive>> {
    if (this.index) return this.index;
    try {
      this.index = JSON.parse(
        await readFile(this.INDEX_PATH, 'utf8'),
      ) as Record<string, CountedArchive>;
    } catch {
      this.index = {};
    }
    return this.index;
  }

  private async saveIndex(): Promise<void> {
    try {
      await mkdir(path.dirname(this.INDEX_PATH), { recursive: true });
      await writeFile(this.INDEX_PATH, JSON.stringify(this.index ?? {}));
    } catch (error: any) {
      // A cache that cannot be written is slow, not broken.
      this.logger.warn(
        `Could not persist the library index: ${error?.message}`,
      );
    }
  }

  private async countImages(archivePath: string): Promise<number> {
    const index = await this.loadIndex();
    const stats = await stat(archivePath).catch(() => null);
    if (!stats) return 0;

    const cached = index[archivePath];
    if (
      cached &&
      cached.size === stats.size &&
      cached.mtimeMs === stats.mtimeMs
    ) {
      return cached.imageCount;
    }

    let imageCount = 0;
    try {
      imageCount = new AdmZip(archivePath)
        .getEntries()
        .filter((e) => /\.(webp|jpg|jpeg|png|gif)$/i.test(e.name)).length;
    } catch {
      // Corrupt or unreadable archive — list with 0 images.
    }

    index[archivePath] = {
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      imageCount,
    };
    this.indexDirty = true;
    return imageCount;
  }

  private indexDirty = false;
  async getLocalLibrary(): Promise<LocalMangaLibrary> {
    let seriesDirs: string[] = [];
    try {
      seriesDirs = await readdir(MANGA_ROOT);
    } catch {
      return { series: [], totalSeries: 0, totalChapters: 0 };
    }

    const series: LocalMangaSeries[] = [];

    for (const seriesName of seriesDirs) {
      const seriesPath = path.join(MANGA_ROOT, seriesName);
      const seriesStat = await stat(seriesPath).catch(() => null);
      if (!seriesStat?.isDirectory()) continue;

      const entries = await readdir(seriesPath).catch(() => [] as string[]);

      // Collect unique chapter slugs from both .cbz and .epub files.
      const slugMap = new Map<string, { hasCbz: boolean; hasEpub: boolean }>();
      for (const entry of entries) {
        if (/\.cbz$/i.test(entry)) {
          const slug = entry.replace(/\.cbz$/i, '');
          const existing = slugMap.get(slug) ?? {
            hasCbz: false,
            hasEpub: false,
          };
          slugMap.set(slug, { ...existing, hasCbz: true });
        } else if (/\.epub$/i.test(entry)) {
          const slug = entry.replace(/\.epub$/i, '');
          const existing = slugMap.get(slug) ?? {
            hasCbz: false,
            hasEpub: false,
          };
          slugMap.set(slug, { ...existing, hasEpub: true });
        }
      }

      const chapters: LocalMangaChapter[] = [];

      for (const [slug, { hasCbz, hasEpub }] of slugMap) {
        // Count images from CBZ when available; fall back to EPUB.
        const archivePath = hasCbz
          ? path.join(seriesPath, `${slug}.cbz`)
          : path.join(seriesPath, `${slug}.epub`);

        const imageCount = await this.countImages(archivePath);

        chapters.push({ slug, imageCount, hasCbz, hasEpub });
      }

      // Sort chapters numerically (handles "8.5" between "8" and "9").
      chapters.sort((a, b) => {
        const na = parseFloat(a.slug);
        const nb = parseFloat(b.slug);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.slug.localeCompare(b.slug);
      });

      series.push({
        slug: seriesName,
        chapters,
        totalImages: chapters.reduce((s, c) => s + c.imageCount, 0),
      });
    }

    if (this.indexDirty) {
      this.indexDirty = false;
      await this.saveIndex();
    }

    return {
      series,
      totalSeries: series.length,
      totalChapters: series.reduce((s, sr) => s + sr.chapters.length, 0),
    };
  }
}
