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

export type FileDownloadStatus = 'downloaded' | 'skipped' | 'failed';

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

export class ScrapeService {
  static getCatalog(consoleKey: string, regions?: string[]) {
    const params = new URLSearchParams({ console: consoleKey });
    if (regions?.length) params.append('regions', regions.join(','));
    return apiGET<CatalogResult>(`/boffmedia/herramientas/scrape/myrient/catalog?${params}`);
  }

  /**
   * Uses raw fetch with no timeout so long-running bulk downloads are not
   * cancelled by Next.js or the browser default timeout.
   */
  static async downloadSelected(dto: {
    console: string;
    games: GameFileEntry[];
    concurrency?: number;
  }) {
    const apiUrl = process.env.NEXT_PUBLIC_API ?? '';
    const res = await fetch(`${apiUrl}/boffmedia/herramientas/scrape/myrient/download-selected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
      // No cache, no revalidate — and critically no next: { revalidate }
      // so Next.js does not wrap this in a limited fetch.
      cache: 'no-store',
    });
    return res.json() as Promise<{ success: boolean; data?: BulkDownloadResult; message?: string; error?: string }>;
  }
}
