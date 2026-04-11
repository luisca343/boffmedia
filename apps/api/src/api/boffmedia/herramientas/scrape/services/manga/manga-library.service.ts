// ---------------------------------------------------------------------------
// MangaLibraryService — scans MANGA_ROOT on disk and returns the local
// library structure. Scraper-agnostic: works for any downloaded series.
// ---------------------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import { readdir, stat } from 'fs/promises';
import * as path from 'path';
import { LocalMangaChapter, LocalMangaLibrary, LocalMangaSeries } from './manga.types';

const MANGA_ROOT = path.join(process.cwd(), 'laboon/manga/downloads/mangas');

@Injectable()
export class MangaLibraryService {
  async getLocalLibrary(): Promise<LocalMangaLibrary> {
    let seriesDirs: string[] = [];
    try {
      seriesDirs = await readdir(MANGA_ROOT);
    } catch {
      // Root doesn't exist yet — empty library.
      return { series: [], totalSeries: 0, totalChapters: 0 };
    }

    const series: LocalMangaSeries[] = [];

    for (const seriesSlug of seriesDirs) {
      const seriesPath = path.join(MANGA_ROOT, seriesSlug);
      const seriesStat = await stat(seriesPath).catch(() => null);
      if (!seriesStat?.isDirectory()) continue;

      const chapterDirs = await readdir(seriesPath).catch(() => [] as string[]);
      const chapters: LocalMangaChapter[] = [];

      for (const chapterSlug of chapterDirs) {
        const chapterPath = path.join(seriesPath, chapterSlug);
        const chapterStat = await stat(chapterPath).catch(() => null);
        if (!chapterStat?.isDirectory()) continue;

        const images = await readdir(chapterPath).catch(() => [] as string[]);
        const imageCount = images.filter(f =>
          /\.(webp|jpg|jpeg|png|gif)$/i.test(f),
        ).length;

        chapters.push({ slug: chapterSlug, imageCount });
      }

      series.push({
        slug: seriesSlug,
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
