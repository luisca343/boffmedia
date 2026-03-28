import { apiGET, apiPOST } from '@/services/boffAPI';

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

  static downloadSelected(dto: {
    console: string;
    games: GameFileEntry[];
    concurrency?: number;
  }) {
    return apiPOST<BulkDownloadResult>(
      '/boffmedia/herramientas/scrape/myrient/download-selected',
      dto,
    );
  }
}
