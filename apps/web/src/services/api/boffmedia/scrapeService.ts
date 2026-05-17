import { apiGET, apiPATCH, apiPOST } from '@/services/boffAPI';
import type {
  LocalGamesResult,
  CatalogSearchResult,
  SearchLocalGamesResult,
  SearchConsoleResult,
  CatalogSearchConsoleResult,
  BulkDownloadResult,
} from '@boffmedia/shared';

export type { SearchConsoleResult, SearchLocalGamesResult, CatalogSearchResult, CatalogSearchConsoleResult, BulkDownloadResult };

export interface GameFileEntry {
  name: string;
  link: string;
  size: string;
}

export interface CatalogResult {
  count: number;
  totalSize: string;
  totalSizeBytes: number;
  files: GameFileEntry[];
}

export type FileDownloadStatus = 'pending' | 'downloading' | 'downloaded' | 'skipped' | 'failed';

export interface FileDownloadEntry {
  filename: string;
  status: FileDownloadStatus;
  size?: string;
  sizeBytes?: number;
  error?: string;
}

// SSE event types emitted by the stream endpoint
export type SseStartEvent    = { type: 'start';    total: number };
export type SseProgressEvent = { type: 'progress'; index: number; total: number } & FileDownloadEntry;
export type SseDoneEvent     = { type: 'done' } & Omit<BulkDownloadResult, 'files' | 'regions' | 'totalMatched'>;
export type SseEvent         = SseStartEvent | SseProgressEvent | SseDoneEvent;

// ── Manga types ───────────────────────────────────────────────────────────────

export interface EpubMetadata {
  title?: string;
  language?: string;
  author?: string;
  authorSort?: string;
  illustrator?: string;
  illustratorSort?: string;
  publisher?: string;
  date?: string;
  subjects?: string[];
}

export interface MangaSearchResult {
  title: string;
  url: string;
  cover: string;
}

export interface MangaChapter {
  title: string;
  url: string;
  number: number | null;
}

export interface MangaChapterDownloadResult {
  chapter: string;
  imageUrls: string[];
  downloaded: number;
  skipped: number;
  failed: number;
  saveDir: string;
}

export interface MangaNovelDownloadResult {
  novelTitle: string;
  chapters: MangaChapterDownloadResult[];
  totalDownloaded: number;
  totalFailed: number;
}

export interface LocalMangaChapter {
  slug: string;
  imageCount: number;
  hasCbz: boolean;
  hasEpub: boolean;
}

export interface ChapterPageInfo {
  index: number;
  filename: string;
  mimeType: string;
}

export interface LocalMangaSeries {
  slug: string;
  chapters: LocalMangaChapter[];
  totalImages: number;
}

export interface LocalMangaLibrary {
  series: LocalMangaSeries[];
  totalSeries: number;
  totalChapters: number;
}

export interface BrowserConfig {
  tunnelEnabled: boolean;
  tunnelAvailable: boolean;
}

export type MangaDownloadSseEvent =
  | { type: 'start'; total: number; novelTitle: string }
  | { type: 'chapter'; index: number; total: number; chapter: string; downloaded: number; skipped: number; failed: number }
  | { type: 'done'; novelTitle: string; totalDownloaded: number; totalFailed: number };

export class ScrapeService {
  static getLocalGames(consoleKey: string, regions?: string[]) {
    const params = new URLSearchParams({ console: consoleKey });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<LocalGamesResult>(`/boffmedia/herramientas/scrape/myrient/local?${params}`);
  }

  static searchCatalog(query: string, regions?: string[]) {
    const params = new URLSearchParams({ q: query });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<CatalogSearchResult>(`/boffmedia/herramientas/scrape/myrient/catalog/search?${params}`);
  }

  static searchLocalGames(query: string, regions?: string[]) {
    const params = new URLSearchParams({ q: query });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<SearchLocalGamesResult>(`/boffmedia/herramientas/scrape/myrient/search?${params}`);
  }

  static getServeFileUrl(consoleKey: string, filename: string): string {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    return `${apiUrl}/boffmedia/herramientas/scrape/myrient/serve-file?console=${encodeURIComponent(consoleKey)}&filename=${encodeURIComponent(filename)}`;
  }

  static getCatalog(consoleKey: string, regions?: string[]) {
    const params = new URLSearchParams({ console: consoleKey });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<CatalogResult>(`/boffmedia/herramientas/scrape/myrient/catalog?${params}`);
  }

  // ── Manga ───────────────────────────────────────────────────────────────────

  static getLocalMangaLibrary() {
    return apiGET<LocalMangaLibrary>('/boffmedia/herramientas/scrape/manga/library');
  }

  static getBrowserConfig() {
    return apiGET<BrowserConfig>('/boffmedia/herramientas/scrape/manga/browser');
  }

  static setBrowserTunnel(tunnelEnabled: boolean) {
    return apiPATCH<BrowserConfig>('/boffmedia/herramientas/scrape/manga/browser', { tunnelEnabled });
  }

  static getNovelInfo(novelUrl: string) {
    return apiGET<{ title: string; url: string }>(`/boffmedia/herramientas/scrape/manga/info?url=${encodeURIComponent(novelUrl)}`);
  }

  static searchManga(query: string) {
    return apiGET<MangaSearchResult[]>(`/boffmedia/herramientas/scrape/manga/search?q=${encodeURIComponent(query)}`);
  }

  static getMangaChapters(novelUrl: string) {
    return apiGET<MangaChapter[]>(`/boffmedia/herramientas/scrape/manga/chapters?url=${encodeURIComponent(novelUrl)}`);
  }

  /**
   * Streams SSE progress events for a manga novel download.
   * Events: { type:'start', total, novelTitle }
   *       | { type:'chapter', index, total, chapter, downloaded, skipped, failed }
   *       | { type:'done', novelTitle, totalDownloaded, totalFailed }
   */
  static async streamDownloadMangaNovel(
    body: { url: string; from?: number; to?: number; skipDownloaded?: boolean },
    onEvent: (event: MangaDownloadSseEvent) => void,
  ): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    const res = await fetch(
      `${apiUrl}/boffmedia/herramientas/scrape/manga/download/novel/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );

    if (!res.body) throw new Error('No response body from stream endpoint.');

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
        try { onEvent(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
      }
    }
  }

  /**
   * Streams SSE progress events for a bulk download.
   * Calls the callback for each parsed event as it arrives.
   * Returns a promise that resolves when the stream closes.
   */
  static async streamDownloadSelected(
    dto: { console: string; games: GameFileEntry[]; concurrency?: number },
    onEvent: (event: SseEvent) => void,
  ): Promise<void> {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    const res = await fetch(
      `${apiUrl}/boffmedia/herramientas/scrape/myrient/download-selected/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        cache: 'no-store',
      },
    );

    if (!res.body) throw new Error('No response body from stream endpoint.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? ''; // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: SseEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // malformed line — skip
        }
      }
    }
  }

  // ── Manga Library Editor ─────────────────────────────────────────────────

  static getChapterPageList(series: string, chapter: string) {
    const params = new URLSearchParams({ series, chapter });
    return apiGET<ChapterPageInfo[]>(`/boffmedia/herramientas/scrape/manga/chapter-pages?${params}`);
  }

  /** Returns a URL suitable for use as an <img src>. No auth needed. */
  static getChapterImageUrl(series: string, chapter: string, page: number): string {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    const params = new URLSearchParams({ series, chapter, page: String(page) });
    return `${apiUrl}/boffmedia/herramientas/scrape/manga/chapter-image?${params}`;
  }

  static convertMangaChapter(series: string, chapter: string, excludePages: number[], includeCover?: boolean, metadata?: EpubMetadata) {
    return apiPOST<{ outputPath: string }>(
      '/boffmedia/herramientas/scrape/manga/convert-chapter',
      { series, chapter, excludePages, includeCover, metadata },
    );
  }

  static patchEpubMetadata(series: string, chapters: string[], metadata: EpubMetadata) {
    return apiPOST<{ results: { chapter: string; updated: boolean }[]; updated: number }>(
      '/boffmedia/herramientas/scrape/manga/patch-metadata',
      { series, chapters, metadata },
    );
  }
}
