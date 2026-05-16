import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { MangaFacadeService } from './manga.facade.service';
import { MangaSearchResult } from './entities/manga-result.entity';
import {
  MangaDetail,
  LocalChaptersResult,
} from './entities/manga-chapter.entity';
import { DownloadChaptersDto } from './dto/download-chapters.dto';

@ApiTags('BoffMedia | Manga')
@Controller('boffmedia/herramientas/manga')
@UseInterceptors(ResponseInterceptor)
export class MangaController {
  constructor(private readonly facade: MangaFacadeService) {}

  // ── Search ────────────────────────────────────────────────────────────────

  @Get('search')
  @ApiOperation({
    summary: 'Search for manga titles across configured sources',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search query, e.g. "raeliana"',
  })
  @ApiResponse({ status: HttpStatus.OK, type: MangaSearchResult })
  async search(@Query('q') query: string): Promise<MangaSearchResult> {
    return this.facade.search(query ?? '');
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  @Get('detail')
  @ApiOperation({
    summary: 'Get manga detail and full chapter list from a source URL',
  })
  @ApiQuery({
    name: 'url',
    type: String,
    description: 'Full URL of the manga detail page',
  })
  @ApiResponse({ status: HttpStatus.OK, type: MangaDetail })
  async getDetail(@Query('url') mangaUrl: string): Promise<MangaDetail> {
    return this.facade.getDetail(mangaUrl);
  }

  // ── Local chapters ────────────────────────────────────────────────────────

  @Get('local')
  @ApiOperation({
    summary: 'List locally downloaded .cbz files for a manga series',
  })
  @ApiQuery({
    name: 'series',
    type: String,
    description: 'Series name (used as folder name)',
  })
  @ApiResponse({ status: HttpStatus.OK, type: LocalChaptersResult })
  async getLocalChapters(
    @Query('series') seriesName: string,
  ): Promise<LocalChaptersResult> {
    return this.facade.getLocalChapters(seriesName ?? '');
  }

  // ── Download (SSE stream) ─────────────────────────────────────────────────

  @Post('download/stream')
  @ApiOperation({
    summary: 'Download chapters and stream progress via SSE',
    description:
      'Accepts a list of chapters to download. Streams Server-Sent Events as each chapter ' +
      'is processed. Events: start → chapter (downloading) → chapter (done/skipped/failed) → done.',
  })
  @ApiBody({ type: DownloadChaptersDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream of download events.',
  })
  async streamDownload(
    @Body() dto: DownloadChaptersDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of this.facade.streamDownloadChapters(dto)) {
      res.write(chunk);
    }
    res.end();
  }
}
