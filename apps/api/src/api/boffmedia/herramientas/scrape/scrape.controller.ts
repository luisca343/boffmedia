import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ScrapeFacadeService } from './scrape.facade.service';
import { EuropeAggregateResult } from './entities/europe-aggregate.entity';
import {
  LocalGamesResult,
  SearchLocalGamesResult,
  CatalogSearchResult,
} from './entities/local-games.entity';
import { DownloadResult } from './entities/download-result.entity';
import { BulkDownloadResult } from './entities/bulk-download-result.entity';
import { DownloadAllGamesDto } from './dto/download-all-games.dto';
import { DownloadSelectedGamesDto } from './dto/download-selected-games.dto';
import { DownloadMangaNovelDto } from './dto/download-manga-novel.dto';
import { MyrientConsole } from './enums/myrient-console.enum';
import { DownloadGameDto } from './dto/download-game.dto';
import { SetBrowserTunnelDto } from './dto/set-browser-tunnel.dto';
import { ConvertChapterDto } from './dto/convert-chapter.dto';
import { PatchEpubMetadataDto } from './dto/patch-epub-metadata.dto';
import { UpdateMangaConfigDto } from './dto/update-manga-config.dto';
import { UpdateSeriesStatusDto } from './dto/update-series-status.dto';

@ApiTags('BoffMedia | Scrape')
@Controller('boffmedia/herramientas/scrape')
export class ScrapeController {
  constructor(private readonly scrapeFacadeService: ScrapeFacadeService) {}

  // ==================== MYRIENT ====================

  @Get('myrient/catalog')
  @ApiOperation({
    summary: 'Get game catalog from Myrient with optional region filter',
    description:
      'Returns files with aggregated total size. Pass `regions` (comma-separated) to filter, e.g. `regions=Europe`. Leave blank for the full catalog.',
  })
  @ApiQuery({
    name: 'console',
    enum: MyrientConsole,
    description: 'Target console',
  })
  @ApiQuery({
    name: 'regions',
    required: false,
    type: String,
    description: 'Comma-separated region filters, e.g. Europe or USA,Europe',
    example: 'Europe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filtered game list with aggregated total size.',
    type: EuropeAggregateResult,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to scrape catalog.',
  })
  async getCatalog(
    @Query('console') consoleKey: MyrientConsole,
    @Query('regions') regions?: string,
  ): Promise<EuropeAggregateResult> {
    const regionList = regions
      ? regions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    return this.scrapeFacadeService.getMyrientCatalog(consoleKey, regionList);
  }

  // ==================== LOCAL LIBRARY ====================

  @Get('myrient/local')
  @ApiOperation({
    summary: 'Get locally downloaded games for a console',
    description:
      'Reads the laboon download folder for the given console and returns all files present, with optional region filter.',
  })
  @ApiQuery({
    name: 'console',
    enum: MyrientConsole,
    description: 'Target console',
  })
  @ApiQuery({
    name: 'regions',
    required: false,
    type: String,
    description: 'Comma-separated region filters',
    example: 'Europe',
  })
  @ApiResponse({ status: HttpStatus.OK, type: LocalGamesResult })
  async getLocalGames(
    @Query('console') consoleKey: MyrientConsole,
    @Query('regions') regions?: string,
  ): Promise<LocalGamesResult> {
    const regionList = regions
      ? regions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    return this.scrapeFacadeService.getLocalGames(consoleKey, regionList);
  }

  @Get('myrient/catalog/search')
  @ApiOperation({
    summary: 'Search remote Myrient catalogs across all consoles',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search query (matched against filename)',
  })
  @ApiQuery({
    name: 'regions',
    required: false,
    type: String,
    description: 'Comma-separated region filters',
    example: 'Europe',
  })
  @ApiResponse({ status: HttpStatus.OK, type: CatalogSearchResult })
  async searchCatalog(
    @Query('q') query: string,
    @Query('regions') regions?: string,
  ): Promise<CatalogSearchResult> {
    const regionList = regions
      ? regions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    return this.scrapeFacadeService.searchCatalog(query ?? '', regionList);
  }

  @Get('myrient/search')
  @ApiOperation({
    summary: 'Search locally downloaded games across all consoles',
  })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search query (matched against filename)',
  })
  @ApiQuery({
    name: 'regions',
    required: false,
    type: String,
    description: 'Comma-separated region filters',
    example: 'Europe',
  })
  @ApiResponse({ status: HttpStatus.OK, type: SearchLocalGamesResult })
  async searchLocalGames(
    @Query('q') query: string,
    @Query('regions') regions?: string,
  ): Promise<SearchLocalGamesResult> {
    const regionList = regions
      ? regions
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
      : [];
    return this.scrapeFacadeService.searchLocalGames(query ?? '', regionList);
  }

  @Get('myrient/serve-file')
  @ApiOperation({
    summary: 'Stream a locally-stored game file to the browser for download',
  })
  @ApiQuery({ name: 'console', enum: MyrientConsole })
  @ApiQuery({ name: 'filename', type: String })
  async serveFile(
    @Query('console') consoleKey: MyrientConsole,
    @Query('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { filePath, safeName } =
        await this.scrapeFacadeService.resolveLocalFile(consoleKey, filename);
      res.download(filePath, safeName);
    } catch {
      res.status(404).json({ error: 'File not found' });
    }
  }

  // ==================== DOWNLOADS ====================

  @Post('myrient/download')
  @ApiOperation({
    summary: 'Download a game file from Myrient to the local 3DS directory',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: {
          type: 'string',
          example:
            'https://myrient.erista.me/2in1%20-%20Life%20with%20Horses%203D%20%2B%20My%20Baby%20Pet%20Hotel%203D%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%29.zip',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File downloaded successfully.',
    type: DownloadResult,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to download file.',
  })
  async downloadGame(@Body() body: DownloadGameDto): Promise<DownloadResult> {
    return this.scrapeFacadeService.downloadGame(body.url);
  }

  @Post('myrient/download-all')
  @ApiOperation({
    summary: 'Download all games for a console with optional region filters',
    description:
      'Scrapes the Myrient catalog for the given console, optionally filters by region(s), skips already-downloaded files, and streams each file to disk. Concurrency is capped at 5.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Bulk download completed. Returns per-file status and aggregate stats.',
    type: BulkDownloadResult,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Bulk download failed.',
  })
  async downloadAllGames(
    @Body() dto: DownloadAllGamesDto,
  ): Promise<BulkDownloadResult> {
    return this.scrapeFacadeService.downloadAllGames(dto);
  }

  @Post('myrient/download-selected/stream')
  @ApiOperation({
    summary: 'Stream download progress for selected games via SSE',
    description:
      'Same as download-selected but streams Server-Sent Events so the client can ' +
      'track per-file progress in real time. Each event is a JSON object with a `type` ' +
      'field: "start", "progress", or "done".',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream of download progress events.',
  })
  async streamDownloadSelected(
    @Body() dto: DownloadSelectedGamesDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of this.scrapeFacadeService.streamDownloadSelected(
      dto,
    )) {
      res.write(chunk);
    }
    res.end();
  }

  // ==================== MANGA ====================

  @Get('manga/library')
  @ApiOperation({
    summary: 'Get all locally downloaded manga series and their chapters',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Local manga library.' })
  async getLocalMangaLibrary() {
    return this.scrapeFacadeService.getLocalMangaLibrary();
  }

  @Get('manga/browser')
  @ApiOperation({ summary: 'Get current browser config (tunnel on/off)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Browser config.' })
  getBrowserConfig() {
    return this.scrapeFacadeService.getBrowserConfig();
  }

  @Patch('manga/browser')
  @ApiOperation({ summary: 'Enable or disable the remote browser tunnel' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated browser config.',
  })
  async setBrowserTunnel(@Body() body: SetBrowserTunnelDto) {
    return this.scrapeFacadeService.setBrowserTunnel(body.tunnelEnabled);
  }

  @Get('manga/search')
  @ApiOperation({ summary: 'Search novelcool.com for a manga title' })
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Search query',
    example: 'Raeliana',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of matching manga.',
  })
  async searchManga(@Query('q') query: string) {
    if (!query?.trim()) throw new BadRequestException('q is required');
    return this.scrapeFacadeService.searchManga(query);
  }

  @Get('manga/info')
  @ApiOperation({
    summary: 'Get title for a novel URL (used for direct URL input)',
  })
  @ApiQuery({ name: 'url', type: String, description: 'Novel page URL' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Novel title and URL.' })
  async getNovelInfo(@Query('url') url: string) {
    if (!url?.trim()) throw new BadRequestException('url is required');
    return this.scrapeFacadeService.getNovelInfo(url);
  }

  @Get('manga/chapters')
  @ApiOperation({
    summary: 'Get the full ordered chapter list for a novelcool.com novel',
  })
  @ApiQuery({
    name: 'url',
    type: String,
    description: 'Novel page URL',
    example:
      'https://es.novelcool.com/novel/La-Raz-n-Por-La-Que-Raeliana-Termin-En-La-Mansi-n-Del-Duque.html',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordered list of chapters (title + url).',
  })
  async getMangaChapters(@Query('url') url: string) {
    if (!url?.trim()) throw new BadRequestException('url is required');
    return this.scrapeFacadeService.getMangaChapters(url);
  }

  @Post('manga/download/novel/stream')
  @ApiOperation({
    summary: 'Stream manga download progress via SSE',
    description:
      'Scrapes every selected chapter with Playwright and streams per-chapter progress events. Events: start, chapter, done.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream of download progress events.',
  })
  async streamDownloadMangaNovel(
    @Body() dto: DownloadMangaNovelDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of this.scrapeFacadeService.streamDownloadMangaNovel(
      dto.url,
      dto.from,
      dto.to,
      dto.skipDownloaded ?? true,
    )) {
      res.write(chunk);
    }
    res.end();
  }

  @Post('myrient/download-selected')
  @ApiOperation({
    summary: 'Download a user-selected list of games for a console',
    description:
      'Receives the exact game entries chosen by the user (name + direct link + size) and downloads ' +
      'them to the console-specific local folder. Already-downloaded files are skipped. ' +
      'Concurrency is capped at 5. Pair with GET /myrient/catalog to build a pick-list UI.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Selected download completed. Returns per-file status and aggregate stats.',
    type: BulkDownloadResult,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Selected download failed.',
  })
  async downloadSelectedGames(
    @Body() dto: DownloadSelectedGamesDto,
  ): Promise<BulkDownloadResult> {
    return this.scrapeFacadeService.downloadSelectedGames(dto);
  }

  // ==================== MANGA LIBRARY EDITOR ====================

  @Get('manga/chapter-pages')
  @ApiOperation({ summary: 'List all pages in a local chapter (CBZ or EPUB)' })
  @ApiQuery({ name: 'series', type: String })
  @ApiQuery({ name: 'chapter', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ordered list of page metadata.',
  })
  async getChapterPages(
    @Query('series') series: string,
    @Query('chapter') chapter: string,
  ) {
    if (!series?.trim()) throw new BadRequestException('series is required');
    if (!chapter?.trim()) throw new BadRequestException('chapter is required');
    return this.scrapeFacadeService.getMangaChapterPageList(series, chapter);
  }

  @Get('manga/chapter-image')
  @ApiOperation({
    summary: 'Serve a single raw page image from a local chapter',
  })
  @ApiQuery({ name: 'series', type: String })
  @ApiQuery({ name: 'chapter', type: String })
  @ApiQuery({ name: 'page', type: Number })
  async serveChapterImage(
    @Query('series') series: string,
    @Query('chapter') chapter: string,
    @Query('page') page: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!series?.trim()) throw new BadRequestException('series is required');
    if (!chapter?.trim()) throw new BadRequestException('chapter is required');
    const pageIndex = parseInt(page, 10);
    if (isNaN(pageIndex))
      throw new BadRequestException('page must be a number');
    await this.scrapeFacadeService.serveChapterImage(
      series,
      chapter,
      pageIndex,
      res,
    );
  }

  @Post('manga/convert-chapter')
  @ApiOperation({
    summary: 'Convert a CBZ chapter to EPUB, optionally excluding pages',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'EPUB created. Returns output path.',
  })
  async convertChapter(
    @Body() body: ConvertChapterDto,
  ): Promise<{ outputPath: string }> {
    if (!body.series?.trim())
      throw new BadRequestException('series is required');
    if (!body.chapter?.trim())
      throw new BadRequestException('chapter is required');
    return this.scrapeFacadeService.convertMangaChapter(
      body.series,
      body.chapter,
      body.excludePages ?? [],
      body.includeCover,
      body.metadata,
    );
  }

  @Post('manga/patch-metadata')
  @ApiOperation({
    summary: 'Patch metadata in existing EPUB files without re-converting',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Results per chapter.',
  })
  async patchEpubMetadata(@Body() body: PatchEpubMetadataDto) {
    if (!body.series?.trim())
      throw new BadRequestException('series is required');
    if (!Array.isArray(body.chapters) || body.chapters.length === 0)
      throw new BadRequestException('chapters is required');
    return this.scrapeFacadeService.patchMangaEpubMetadata(
      body.series,
      body.chapters,
      body.metadata ?? {},
    );
  }

  // ==================== MANGA CONFIG ====================

  @Get('manga/config')
  @ApiOperation({
    summary: 'Get manga admin config (cron settings + series status)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  getMangaConfig() {
    return this.scrapeFacadeService.getMangaConfig();
  }

  @Patch('manga/config')
  @ApiOperation({
    summary: 'Update manga admin config (cron enable/disable + schedule)',
  })
  @ApiResponse({ status: HttpStatus.OK })
  async updateMangaConfig(@Body() body: UpdateMangaConfigDto) {
    return this.scrapeFacadeService.updateMangaConfig(body);
  }

  @Patch('manga/series/:slug/status')
  @ApiOperation({ summary: 'Update the status of a tracked manga series' })
  @ApiResponse({ status: HttpStatus.OK })
  async updateSeriesStatus(
    @Param('slug') slug: string,
    @Body() body: UpdateSeriesStatusDto,
  ) {
    if (!slug?.trim()) throw new BadRequestException('slug is required');
    return this.scrapeFacadeService.updateSeriesStatus(slug, body.status);
  }

  @Post('manga/cron/run')
  @ApiOperation({ summary: 'Manually trigger the manga auto-update cron task' })
  @ApiResponse({ status: HttpStatus.CREATED })
  async runMangaCron() {
    return this.scrapeFacadeService.runMangaCron();
  }
}
