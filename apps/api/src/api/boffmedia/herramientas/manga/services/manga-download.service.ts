import { Injectable, Logger } from '@nestjs/common';
import { NovecoolService } from './novecool.service';
import { CbzService } from './cbz.service';
import {
  DownloadChaptersDto,
  ChapterEntry,
} from '../dto/download-chapters.dto';
import { ChapterDownloadEntry } from '../entities/download-result.entity';

// ---------------------------------------------------------------------------
// MangaDownloadService
//
// Orchestrates the full pipeline for a chapter download:
//   1. Fetch chapter image URLs (Novecool scraper)
//   2. Download images in parallel (bounded concurrency)
//   3. Build and save the .cbz archive (CbzService)
//   4. Yield SSE events for real-time frontend progress
// ---------------------------------------------------------------------------

/** Concurrency limit for parallel image downloads within a single chapter. */
const IMAGE_CONCURRENCY = 4;

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

@Injectable()
export class MangaDownloadService {
  private readonly logger = new Logger(MangaDownloadService.name);

  constructor(
    private readonly novecool: NovecoolService,
    private readonly cbz: CbzService,
  ) {}

  /**
   * Streams SSE events as each chapter in the dto is processed.
   *
   * Emitted events (each line: `data: <JSON>\n\n`):
   *   { type: 'start',    total: N }
   *   { type: 'chapter',  index: N, total: N, title: string, status: 'downloading' }
   *   { type: 'chapter',  index: N, total: N, title: string, status: 'downloaded'|'skipped'|'failed',
   *                        filename?: string, pages?: number, error?: string }
   *   { type: 'done',     downloaded: N, skipped: N, failed: N }
   */
  async *streamDownloadChapters(
    dto: DownloadChaptersDto,
  ): AsyncGenerator<string> {
    const { seriesName, chapters } = dto;
    const chapterConcurrency = Math.min(Math.max(dto.concurrency ?? 1, 1), 3);

    this.logger.log(
      `[Manga] Starting download of ${chapters.length} chapter(s) for "${seriesName}" (concurrency=${chapterConcurrency})`,
    );

    yield sse({ type: 'start', total: chapters.length });

    let downloaded = 0,
      skipped = 0,
      failed = 0;

    // Process chapters in batches of `chapterConcurrency`
    for (
      let batchStart = 0;
      batchStart < chapters.length;
      batchStart += chapterConcurrency
    ) {
      const batch = chapters.slice(batchStart, batchStart + chapterConcurrency);

      // Signal all chapters in batch as "downloading" before we start
      // (so the frontend can show them as in-progress simultaneously)
      for (let j = 0; j < batch.length; j++) {
        yield sse({
          type: 'chapter',
          index: batchStart + j + 1,
          total: chapters.length,
          title: batch[j].title,
          status: 'downloading',
        });
      }

      const batchResults = await Promise.all(
        batch.map((chapter, j) =>
          this.processChapter(
            seriesName,
            chapter,
            batchStart + j + 1,
            chapters.length,
            dto.mangaUrl,
          ),
        ),
      );

      for (const result of batchResults) {
        if (result.status === 'downloaded') downloaded++;
        else if (result.status === 'skipped') skipped++;
        else failed++;

        yield sse({
          type: 'chapter',
          index: result.index,
          total: chapters.length,
          title: result.chapterTitle,
          status: result.status,
          filename: result.filename,
          pages: result.pages,
          error: result.error,
        });
      }
    }

    yield sse({ type: 'done', downloaded, skipped, failed });
    this.logger.log(
      `[Manga] Done — ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`,
    );
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private async processChapter(
    seriesName: string,
    chapter: ChapterEntry,
    index: number,
    total: number,
    mangaUrl?: string,
  ): Promise<ChapterDownloadEntry & { index: number }> {
    const { title, url, number } = chapter;
    const prefix = `[${index}/${total}] "${title}"`;

    try {
      // Skip if already on disk
      if (await this.cbz.chapterExists(seriesName, number, title)) {
        this.logger.log(`${prefix} SKIP (already exists)`);
        const filename = this.cbz.chapterFilename(number, title);
        return { index, chapterTitle: title, filename, status: 'skipped' };
      }

      // Fetch image URLs (pass manga URL as Referer to avoid 403)
      const imageUrls = await this.novecool.getChapterImageUrls(url, mangaUrl);
      if (imageUrls.length === 0) {
        throw new Error(
          'No images found on chapter page — selectors may need updating',
        );
      }

      this.logger.log(`${prefix} Downloading ${imageUrls.length} images…`);

      // Download images in parallel (bounded concurrency)
      const imageTasks = imageUrls.map((imageUrl) => async () => {
        const data = await this.novecool.downloadImage(imageUrl, url);
        return { data, url: imageUrl };
      });

      const images = await runWithConcurrency(imageTasks, IMAGE_CONCURRENCY);

      // Build and save CBZ
      const filePath = await this.cbz.saveChapter(
        seriesName,
        number,
        title,
        images,
      );
      const filename = filePath.split(/[\\/]/).pop() ?? '';

      this.logger.log(`${prefix} OK → ${filename}`);
      return {
        index,
        chapterTitle: title,
        filename,
        status: 'downloaded',
        pages: images.length,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`${prefix} FAILED: ${error}`);
      return {
        index,
        chapterTitle: title,
        filename: '',
        status: 'failed',
        error,
      };
    }
  }
}

/** Wraps a payload as an SSE `data:` line. */
function sse(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}
