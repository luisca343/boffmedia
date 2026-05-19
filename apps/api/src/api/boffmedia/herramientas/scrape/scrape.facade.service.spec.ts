import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ScrapeFacadeService } from './scrape.facade.service';
import { MyrientScrapeService } from './services/myrient.service';
import { MangaScraperService } from './services/manga.service';
import { MangaBrowserService } from './services/manga/manga-browser.service';
import { MangaEditorService } from './services/manga/manga-editor.service';
import { MangaConfigService } from './services/manga/manga-config.service';
import { MangaCronService } from './services/manga/manga-cron.service';
import { MyrientConsole } from './enums/myrient-console.enum';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockMyrientService = {
  resolveLocalFile: jest.fn(),
  getLocalGames: jest.fn(),
  searchLocalGames: jest.fn(),
  searchCatalog: jest.fn(),
  scrapeCatalog: jest.fn(),
  downloadGame: jest.fn(),
  downloadAllGames: jest.fn(),
  downloadSelectedGames: jest.fn(),
  streamDownloadSelected: jest.fn(),
};

const mockMangaScraperService = {
  searchNovels: jest.fn(),
  getNovelInfo: jest.fn(),
  getChapterList: jest.fn(),
  downloadChapter: jest.fn(),
  streamDownloadNovel: jest.fn(),
  getLocalLibrary: jest.fn(),
};

const mockMangaBrowserService = {
  getTunnelEnabled: jest.fn(),
  tunnelAvailable: jest.fn(),
  setTunnelEnabled: jest.fn(),
};

const mockMangaEditorService = {
  getChapterPageList: jest.fn(),
  serveChapterImage: jest.fn(),
  convertChapter: jest.fn(),
  patchEpubMetadata: jest.fn(),
};

const mockMangaConfigService = {
  getConfig: jest.fn(),
  updateCron: jest.fn(),
  updateSeriesConfig: jest.fn(),
};

const mockMangaCronService = {
  syncCronJob: jest.fn(),
  runAutoUpdate: jest.fn(),
};

describe('ScrapeFacadeService', () => {
  let service: ScrapeFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapeFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: MyrientScrapeService, useValue: mockMyrientService },
        { provide: MangaScraperService, useValue: mockMangaScraperService },
        { provide: MangaBrowserService, useValue: mockMangaBrowserService },
        { provide: MangaEditorService, useValue: mockMangaEditorService },
        { provide: MangaConfigService, useValue: mockMangaConfigService },
        { provide: MangaCronService, useValue: mockMangaCronService },
      ],
    }).compile();

    service = module.get<ScrapeFacadeService>(ScrapeFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── myrient delegation ───────────────────────────────────────────────────────

  describe('resolveLocalFile()', () => {
    it('delegates to myrientScrapeService', async () => {
      mockMyrientService.resolveLocalFile.mockResolvedValue({
        filePath: '/path',
        safeName: 'game',
      });
      const result = await service.resolveLocalFile(
        MyrientConsole.PS2,
        'game.iso',
      );
      expect(result.filePath).toBe('/path');
      expect(mockMyrientService.resolveLocalFile).toHaveBeenCalledWith(
        MyrientConsole.PS2,
        'game.iso',
      );
    });
  });

  describe('getLocalGames()', () => {
    it('delegates to myrientScrapeService', async () => {
      mockMyrientService.getLocalGames.mockResolvedValue({ games: [] });
      await service.getLocalGames(MyrientConsole.PS2, ['EUR']);
      expect(mockMyrientService.getLocalGames).toHaveBeenCalledWith(
        MyrientConsole.PS2,
        ['EUR'],
      );
    });
  });

  describe('getMyrientCatalog()', () => {
    it('delegates to myrientScrapeService.scrapeCatalog', async () => {
      mockMyrientService.scrapeCatalog.mockResolvedValue({ items: [] });
      await service.getMyrientCatalog(MyrientConsole.PS2, ['EUR']);
      expect(mockMyrientService.scrapeCatalog).toHaveBeenCalledWith(
        MyrientConsole.PS2,
        ['EUR'],
      );
    });

    it('wraps scrape errors with a descriptive message', async () => {
      mockMyrientService.scrapeCatalog.mockRejectedValue(
        new Error('network timeout'),
      );
      await expect(
        service.getMyrientCatalog(MyrientConsole.PS2, ['EUR']),
      ).rejects.toThrow('Failed to scrape catalog: network timeout');
    });
  });

  describe('downloadGame()', () => {
    it('delegates to myrientScrapeService.downloadGame', async () => {
      mockMyrientService.downloadGame.mockResolvedValue({ success: true });
      await service.downloadGame('http://example.com/game.iso');
      expect(mockMyrientService.downloadGame).toHaveBeenCalledWith(
        'http://example.com/game.iso',
      );
    });

    it('wraps download errors with a descriptive message', async () => {
      mockMyrientService.downloadGame.mockRejectedValue(
        new Error('connection refused'),
      );
      await expect(
        service.downloadGame('http://example.com/game.iso'),
      ).rejects.toThrow('Failed to download game: connection refused');
    });
  });

  describe('downloadAllGames()', () => {
    it('wraps errors with a descriptive message', async () => {
      mockMyrientService.downloadAllGames.mockRejectedValue(
        new Error('storage full'),
      );
      await expect(service.downloadAllGames({} as any)).rejects.toThrow(
        'Bulk download failed: storage full',
      );
    });
  });

  describe('downloadSelectedGames()', () => {
    it('wraps errors with a descriptive message', async () => {
      mockMyrientService.downloadSelectedGames.mockRejectedValue(
        new Error('missing file'),
      );
      await expect(service.downloadSelectedGames({} as any)).rejects.toThrow(
        'Selected download failed: missing file',
      );
    });
  });

  // ─── manga scraper delegation ─────────────────────────────────────────────────

  describe('searchManga()', () => {
    it('delegates to mangaScraperService.searchNovels', async () => {
      mockMangaScraperService.searchNovels.mockResolvedValue([
        { title: 'One Piece' },
      ]);
      const result = await service.searchManga('one piece');
      expect(result).toHaveLength(1);
    });

    it('wraps search errors', async () => {
      mockMangaScraperService.searchNovels.mockRejectedValue(
        new Error('scrape failed'),
      );
      await expect(service.searchManga('query')).rejects.toThrow(
        'Failed to search manga: scrape failed',
      );
    });
  });

  describe('getNovelInfo()', () => {
    it('wraps errors with a descriptive message', async () => {
      mockMangaScraperService.getNovelInfo.mockRejectedValue(new Error('404'));
      await expect(service.getNovelInfo('http://example.com')).rejects.toThrow(
        'Failed to fetch novel info: 404',
      );
    });
  });

  describe('getMangaChapters()', () => {
    it('wraps chapter list errors', async () => {
      mockMangaScraperService.getChapterList.mockRejectedValue(
        new Error('timeout'),
      );
      await expect(
        service.getMangaChapters('http://example.com'),
      ).rejects.toThrow('Failed to fetch chapter list: timeout');
    });
  });

  describe('downloadMangaChapter()', () => {
    it('wraps download chapter errors', async () => {
      mockMangaScraperService.downloadChapter.mockRejectedValue(
        new Error('io error'),
      );
      await expect(
        service.downloadMangaChapter('http://ch', '/dir'),
      ).rejects.toThrow('Failed to download chapter: io error');
    });
  });

  describe('getLocalMangaLibrary()', () => {
    it('delegates to mangaScraperService.getLocalLibrary', async () => {
      mockMangaScraperService.getLocalLibrary.mockResolvedValue({ series: [] });
      const result = await service.getLocalMangaLibrary();
      expect(mockMangaScraperService.getLocalLibrary).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ─── browser config ───────────────────────────────────────────────────────────

  describe('getBrowserConfig()', () => {
    it('returns combined tunnel state', () => {
      mockMangaBrowserService.getTunnelEnabled.mockReturnValue(true);
      mockMangaBrowserService.tunnelAvailable.mockReturnValue(false);

      const config = service.getBrowserConfig();
      expect(config).toEqual({ tunnelEnabled: true, tunnelAvailable: false });
    });
  });

  describe('setBrowserTunnel()', () => {
    it('calls setTunnelEnabled and returns updated config', async () => {
      mockMangaBrowserService.setTunnelEnabled.mockResolvedValue(undefined);
      mockMangaBrowserService.getTunnelEnabled.mockReturnValue(false);
      mockMangaBrowserService.tunnelAvailable.mockReturnValue(true);

      const result = await service.setBrowserTunnel(false);

      expect(mockMangaBrowserService.setTunnelEnabled).toHaveBeenCalledWith(
        false,
      );
      expect(result).toEqual({ tunnelEnabled: false, tunnelAvailable: true });
    });
  });

  // ─── manga config ─────────────────────────────────────────────────────────────

  describe('getMangaConfig()', () => {
    it('delegates to mangaConfigService.getConfig', () => {
      const config = { cron: { enabled: true } };
      mockMangaConfigService.getConfig.mockReturnValue(config);
      expect(service.getMangaConfig()).toBe(config);
    });
  });

  describe('updateMangaConfig()', () => {
    it('updates cron and syncs the cron job when cron patch is provided', async () => {
      const config = { cron: { enabled: false } };
      mockMangaConfigService.updateCron.mockResolvedValue(undefined);
      mockMangaCronService.syncCronJob.mockResolvedValue(undefined);
      mockMangaConfigService.getConfig.mockReturnValue(config);

      const result = await service.updateMangaConfig({
        cron: { enabled: false },
      });

      expect(mockMangaConfigService.updateCron).toHaveBeenCalled();
      expect(mockMangaCronService.syncCronJob).toHaveBeenCalled();
      expect(result).toBe(config);
    });

    it('skips cron sync when no cron patch is provided', async () => {
      mockMangaConfigService.getConfig.mockReturnValue({});
      await service.updateMangaConfig({});

      expect(mockMangaConfigService.updateCron).not.toHaveBeenCalled();
      expect(mockMangaCronService.syncCronJob).not.toHaveBeenCalled();
    });
  });

  // ─── manga cron ───────────────────────────────────────────────────────────────

  describe('runMangaCron()', () => {
    it('returns immediately without awaiting the cron run', async () => {
      let cronResolved = false;
      mockMangaCronService.runAutoUpdate.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              cronResolved = true;
              resolve(undefined);
            }, 10);
          }),
      );

      const result = await service.runMangaCron();

      expect(result.message).toContain('started');
      expect(cronResolved).toBe(false);
    });
  });

  // ─── patchMangaEpubMetadata ───────────────────────────────────────────────────

  describe('patchMangaEpubMetadata()', () => {
    it('patches each chapter and returns a summary', async () => {
      mockMangaEditorService.patchEpubMetadata
        .mockResolvedValueOnce({ updated: true })
        .mockResolvedValueOnce({ updated: false });

      const result = await service.patchMangaEpubMetadata(
        'one-piece',
        ['ch1', 'ch2'],
        { title: 'OP' } as any,
      );

      expect(result.updated).toBe(1);
      expect(result.results).toHaveLength(2);
    });
  });
});
