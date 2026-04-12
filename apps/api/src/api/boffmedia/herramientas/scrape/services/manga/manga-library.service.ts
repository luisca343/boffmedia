// ---------------------------------------------------------------------------
// MangaLibraryService — scans MANGA_ROOT on disk and returns the local
// library structure. Reads .cbz files; series folders use the original title.
// ---------------------------------------------------------------------------

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
      const cbzFiles = entries.filter(f => /\.cbz$/i.test(f));
      const chapters: LocalMangaChapter[] = [];

      for (const cbzFile of cbzFiles) {
        const cbzPath = path.join(seriesPath, cbzFile);
        const chapterSlug = cbzFile.replace(/\.cbz$/i, '');
        let imageCount = 0;

        try {
          const zip = new AdmZip(cbzPath);
          imageCount = zip.getEntries().filter(e =>
            /\.(webp|jpg|jpeg|png|gif)$/i.test(e.name),
          ).length;
        } catch {
          // Corrupt or unreadable CBZ — still list it with 0 images.
        }

        chapters.push({ slug: chapterSlug, imageCount });
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
