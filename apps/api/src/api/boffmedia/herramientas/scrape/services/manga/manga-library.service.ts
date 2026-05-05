import { Injectable } from '@nestjs/common';
import { readdir, stat } from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { LocalMangaChapter, LocalMangaLibrary, LocalMangaSeries } from './manga.types';
import { MANGA_ROOT } from './manga-constants';

@Injectable()
export class MangaLibraryService {
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
          const existing = slugMap.get(slug) ?? { hasCbz: false, hasEpub: false };
          slugMap.set(slug, { ...existing, hasCbz: true });
        } else if (/\.epub$/i.test(entry)) {
          const slug = entry.replace(/\.epub$/i, '');
          const existing = slugMap.get(slug) ?? { hasCbz: false, hasEpub: false };
          slugMap.set(slug, { ...existing, hasEpub: true });
        }
      }

      const chapters: LocalMangaChapter[] = [];

      for (const [slug, { hasCbz, hasEpub }] of slugMap) {
        let imageCount = 0;

        // Count images from CBZ when available; fall back to EPUB.
        const archivePath = hasCbz
          ? path.join(seriesPath, `${slug}.cbz`)
          : path.join(seriesPath, `${slug}.epub`);

        try {
          const zip = new AdmZip(archivePath);
          imageCount = zip.getEntries().filter(e =>
            /\.(webp|jpg|jpeg|png|gif)$/i.test(e.name),
          ).length;
        } catch {
          // Corrupt or unreadable archive — list with 0 images.
        }

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

    return {
      series,
      totalSeries: series.length,
      totalChapters: series.reduce((s, sr) => s + sr.chapters.length, 0),
    };
  }
}
