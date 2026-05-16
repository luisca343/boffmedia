import { Injectable } from '@nestjs/common';
import { NovecoolService } from './services/novecool.service';
import { CbzService } from './services/cbz.service';
import { MangaDownloadService } from './services/manga-download.service';
import { MangaSearchResult } from './entities/manga-result.entity';
import {
  MangaDetail,
  LocalChaptersResult,
} from './entities/manga-chapter.entity';
import { DownloadChaptersDto } from './dto/download-chapters.dto';

@Injectable()
export class MangaFacadeService {
  constructor(
    private readonly novecool: NovecoolService,
    private readonly cbz: CbzService,
    private readonly downloadService: MangaDownloadService,
  ) {}

  async search(query: string): Promise<MangaSearchResult> {
    const results = await this.novecool.search(query);
    return { query, results };
  }

  async getDetail(mangaUrl: string): Promise<MangaDetail> {
    return this.novecool.getDetail(mangaUrl);
  }

  async getLocalChapters(seriesName: string): Promise<LocalChaptersResult> {
    const files = await this.cbz.listLocalChapters(seriesName);
    return { seriesName, count: files.length, files };
  }

  streamDownloadChapters(dto: DownloadChaptersDto): AsyncGenerator<string> {
    return this.downloadService.streamDownloadChapters(dto);
  }
}
