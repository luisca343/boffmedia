import { apiGET } from '@/services/boffAPI';

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

export interface BulkDownloadResult {
  console: string;
  consoleLabel: string;
  regions: string[];
  totalMatched: number;
  downloaded: number;
  skipped: number;
  failed: number;
  totalDownloadedSize: string;
  totalDownloadedSizeBytes: number;
  files: FileDownloadEntry[];
}

// SSE event types emitted by the stream endpoint
export type SseStartEvent    = { type: 'start';    total: number };
export type SseProgressEvent = { type: 'progress'; index: number; total: number } & FileDownloadEntry;
export type SseDoneEvent     = { type: 'done' } & Omit<BulkDownloadResult, 'files' | 'regions' | 'totalMatched'>;
export type SseEvent         = SseStartEvent | SseProgressEvent | SseDoneEvent;

export interface LocalGameEntry {
  filename: string;
  size: string;
  sizeBytes: number;
}

export interface LocalGamesResult {
  console: string;
  consoleLabel: string;
  count: number;
  totalSize: string;
  totalSizeBytes: number;
  files: LocalGameEntry[];
}

export class ScrapeService {
  static getLocalGames(consoleKey: string, regions?: string[]) {
    const params = new URLSearchParams({ console: consoleKey });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<LocalGamesResult>(`/boffmedia/herramientas/scrape/myrient/local?${params}`);
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
}
