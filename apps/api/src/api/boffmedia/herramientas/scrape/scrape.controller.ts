import { Body, Controller, Get, HttpStatus, Post, Query, Res, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ScrapeFacadeService } from './scrape.facade.service';
import { EuropeAggregateResult } from './entities/europe-aggregate.entity';
import { LocalGamesResult, SearchLocalGamesResult } from './entities/local-games.entity';
import { DownloadResult } from './entities/download-result.entity';
import { BulkDownloadResult } from './entities/bulk-download-result.entity';
import { DownloadAllGamesDto } from './dto/download-all-games.dto';
import { DownloadSelectedGamesDto } from './dto/download-selected-games.dto';
import { MyrientConsole } from './enums/myrient-console.enum';

@ApiTags('BoffMedia | Scrape')
@Controller('boffmedia/herramientas/scrape')
@UseInterceptors(ResponseInterceptor)
export class ScrapeController {
  constructor(private readonly scrapeFacadeService: ScrapeFacadeService) {}

  // ==================== MYRIENT ====================

  @Get('myrient/catalog')
  @ApiOperation({
    summary: 'Get game catalog from Myrient with optional region filter',
    description: 'Returns files with aggregated total size. Pass `regions` (comma-separated) to filter, e.g. `regions=Europe`. Leave blank for the full catalog.',
  })
  @ApiQuery({ name: 'console', enum: MyrientConsole, description: 'Target console' })
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
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to scrape catalog.' })
  async getCatalog(
    @Query('console') consoleKey: MyrientConsole,
    @Query('regions') regions?: string,
  ): Promise<EuropeAggregateResult> {
    const regionList = regions ? regions.split(',').map(r => r.trim()).filter(Boolean) : [];
    return this.scrapeFacadeService.getMyrientCatalog(consoleKey, regionList);
  }

  // ==================== LOCAL LIBRARY ====================

  @Get('myrient/local')
  @ApiOperation({
    summary: 'Get locally downloaded games for a console',
    description: 'Reads the laboon download folder for the given console and returns all files present, with optional region filter.',
  })
  @ApiQuery({ name: 'console', enum: MyrientConsole, description: 'Target console' })
  @ApiQuery({ name: 'regions', required: false, type: String, description: 'Comma-separated region filters', example: 'Europe' })
  @ApiResponse({ status: HttpStatus.OK, type: LocalGamesResult })
  async getLocalGames(
    @Query('console') consoleKey: MyrientConsole,
    @Query('regions') regions?: string,
  ): Promise<LocalGamesResult> {
    const regionList = regions ? regions.split(',').map(r => r.trim()).filter(Boolean) : [];
    return this.scrapeFacadeService.getLocalGames(consoleKey, regionList);
  }

  @Get('myrient/search')
  @ApiOperation({ summary: 'Search locally downloaded games across all consoles' })
  @ApiQuery({ name: 'q', type: String, description: 'Search query (matched against filename)' })
  @ApiQuery({ name: 'regions', required: false, type: String, description: 'Comma-separated region filters', example: 'Europe' })
  @ApiResponse({ status: HttpStatus.OK, type: SearchLocalGamesResult })
  async searchLocalGames(
    @Query('q') query: string,
    @Query('regions') regions?: string,
  ): Promise<SearchLocalGamesResult> {
    const regionList = regions ? regions.split(',').map(r => r.trim()).filter(Boolean) : [];
    return this.scrapeFacadeService.searchLocalGames(query ?? '', regionList);
  }

  @Get('myrient/serve-file')
  @ApiOperation({ summary: 'Stream a locally-stored game file to the browser for download' })
  @ApiQuery({ name: 'console', enum: MyrientConsole })
  @ApiQuery({ name: 'filename', type: String })
  async serveFile(
    @Query('console') consoleKey: MyrientConsole,
    @Query('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { filePath, safeName } = await this.scrapeFacadeService.resolveLocalFile(consoleKey, filename);
      res.download(filePath, safeName);
    } catch {
      res.status(404).json({ error: 'File not found' });
    }
  }

  // ==================== DOWNLOADS ====================

  @Post('myrient/download')
  @ApiOperation({ summary: 'Download a game file from Myrient to the local 3DS directory' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: {
          type: 'string',
          example: 'https://myrient.erista.me/2in1%20-%20Life%20with%20Horses%203D%20%2B%20My%20Baby%20Pet%20Hotel%203D%20%28Europe%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CNl%29.zip',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File downloaded successfully.',
    type: DownloadResult,
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to download file.' })
  async downloadGame(@Body() body: { url: string }): Promise<DownloadResult> {
    return this.scrapeFacadeService.downloadGame(body.url);
  }

  @Post('myrient/download-all')
  @ApiOperation({
    summary: 'Download all games for a console with optional region filters',
    description: 'Scrapes the Myrient catalog for the given console, optionally filters by region(s), skips already-downloaded files, and streams each file to disk. Concurrency is capped at 5.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk download completed. Returns per-file status and aggregate stats.',
    type: BulkDownloadResult,
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Bulk download failed.' })
  async downloadAllGames(@Body() dto: DownloadAllGamesDto): Promise<BulkDownloadResult> {
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
  @ApiResponse({ status: HttpStatus.OK, description: 'SSE stream of download progress events.' })
  async streamDownloadSelected(
    @Body() dto: DownloadSelectedGamesDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    for await (const chunk of this.scrapeFacadeService.streamDownloadSelected(dto)) {
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
    description: 'Selected download completed. Returns per-file status and aggregate stats.',
    type: BulkDownloadResult,
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Selected download failed.' })
  async downloadSelectedGames(@Body() dto: DownloadSelectedGamesDto): Promise<BulkDownloadResult> {
    return this.scrapeFacadeService.downloadSelectedGames(dto);
  }
}
