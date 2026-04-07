import { apiGET, apiPOST } from '@/services/boffAPI';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MangaResult {
  title: string;
  url: string;
  source: string;
  coverUrl?: string;
  tags: string[];
  chapterCount?: number;
}

export interface MangaSearchResult {
  query: string;
  results: MangaResult[];
}

export interface MangaChapter {
  title: string;
  url: string;
  number: string;
}

export interface MangaDetail {
  title: string;
  url: string;
  source: string;
  coverUrl?: string;
  tags: string[];
  chapters: MangaChapter[];
  chapterCount: number;
}

export interface LocalChaptersResult {
  seriesName: string;
  count: number;
  files: string[];
}

export interface ChapterEntry {
  title: string;
  url: string;
  number: string;
}

export interface DownloadChaptersDto {
  seriesName: string;
  chapters: ChapterEntry[];
  concurrency?: number;
  /** Manga detail page URL — sent as Referer when fetching chapter pages to avoid 403s */
  mangaUrl?: string;
}

// ── SSE event types ────────────────────────────────────────────────────────

export type ChapterDownloadStatus = 'downloading' | 'downloaded' | 'skipped' | 'failed';

export interface SseStartEvent {
  type: 'start';
  total: number;
}

export interface SseChapterEvent {
  type: 'chapter';
  index: number;
  total: number;
  title: string;
  status: ChapterDownloadStatus;
  filename?: string;
  pages?: number;
  error?: string;
}

export interface SseDoneEvent {
  type: 'done';
  downloaded: number;
  skipped: number;
  failed: number;
}

export type SseEvent = SseStartEvent | SseChapterEvent | SseDoneEvent;

// ── Service ────────────────────────────────────────────────────────────────

const BASE = '/boffmedia/herramientas/manga';

export class MangaService {
  /** Search for manga across configured sources. */
  static search(query: string) {
    return apiGET<MangaSearchResult>(`${BASE}/search?q=${encodeURIComponent(query)}`);
  }

  /** Get full manga detail (title, tags, chapter list) from a detail page URL. */
  static getDetail(mangaUrl: string) {
    return apiGET<MangaDetail>(`${BASE}/detail?url=${encodeURIComponent(mangaUrl)}`);
  }

  /** List locally downloaded chapters for a series. */
  static getLocalChapters(seriesName: string) {
    return apiGET<LocalChaptersResult>(`${BASE}/local?series=${encodeURIComponent(seriesName)}`);
  }

  /**
   * Streams SSE download events for a set of chapters.
   * Calls `onEvent` for each parsed SSE event; resolves when the stream ends.
   */
  static async streamDownloadChapters(
    dto: DownloadChaptersDto,
    onEvent: (event: SseEvent) => void,
  ): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    const res = await fetch(`${apiUrl}${BASE}/download/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
      cache: 'no-store',
    });

    if (!res.body) throw new Error('No response body from SSE stream endpoint.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6)) as SseEvent;
          onEvent(event);
        } catch {
          // malformed — skip
        }
      }
    }
  }
}
