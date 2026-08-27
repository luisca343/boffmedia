import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingUtil } from './_utils/LoggingUtils';

import { google, sheets_v4 } from 'googleapis';

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { PokemonDataManagementService } from '@api/smartrotom/pokemon/services/pokemon-data-management.service';
import { HealthRepository } from '@api/_utils/health/health.repository';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import { publicPath } from '@/config/paths';
import { ASSET, assetUrl } from '@/config/asset-url';

@Injectable()
export class AppService {
  private imageCache: { [key: string]: string } = {};
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
  private readonly CACHE_FILE_PATH = path.join(
    process.cwd(),
    'var/cache/imageCache.json',
  );

  constructor(
    private readonly logger: Logger,

    private configService: ConfigService,
    private pokemonService: PokemonDataManagementService,
    private readonly healthRepository: HealthRepository,
  ) {
    this.loadCache();
  }

  getDBPort(): number {
    return this.configService.get<number>('DB_PORT') ?? 0;
  }

  toggleLogging() {
    return LoggingUtil.getInstance().toggleLogging();
  }

  /**
   * Public health check: minimal status for load balancers and uptime monitors.
   * Detailed diagnostics are reserved for admins (via getHealthAdmin).
   */
  async getHealth(): Promise<{ status: 'ok' | 'degraded' }> {
    const dbHealth = await this.checkDatabaseConnection();
    const status =
      dbHealth.status === 'error' ? 'degraded' : ('ok' as const);
    return { status };
  }

  /**
   * Admin health check: comprehensive system diagnostics.
   * Exposes memory usage, database latency, Wingull API status, uptime, and
   * response times. Gated behind admin role to prevent operational detail
   * leaking to anonymous callers.
   */
  async getHealthAdmin() {
    const startTime = Date.now();
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connections: {
        database: await this.checkDatabaseConnection(),
        wingullApi: await this.checkWingullApi(),
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(process.memoryUsage().external / 1024 / 1024)}MB`,
      },
      responseTime: `${Date.now() - startTime}ms`,
    };

    // Set overall status based on critical services
    if (health.connections.database.status === 'error') {
      health.status = 'degraded';
    }

    return health;
  }

  private async checkDatabaseConnection(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      // Execute a simple query to check database connectivity
      await this.healthRepository.ping();
      return {
        status: 'ok',
        responseTime: `${Date.now() - startTime}ms`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  private async checkWingullApi(): Promise<{
    status: string;
    responseTime?: string;
    error?: string;
  }> {
    const wingullApiUrl = env.WINGULL_API;

    if (!wingullApiUrl) {
      return {
        status: 'not_configured',
      };
    }

    const startTime = Date.now();
    try {
      await axios.get(`${wingullApiUrl}/health`, {
        timeout: 5000,
      });
      return {
        status: 'ok',
        responseTime: `${Date.now() - startTime}ms`,
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        return {
          status: 'timeout',
          error: 'Request timeout after 5s',
        };
      }
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  async blogicons() {
    const iconsFolderPath = publicPath('blog', 'icons');
    try {
      const files = await fs.readdir(iconsFolderPath);
      const filesObj = files.reduce(
        (acc, file) => {
          acc[file.split('.')[0]] = assetUrl(ASSET.blog, 'icons', file);
          return acc;
        },
        {} as Record<string, string>,
      );
      return filesObj;
    } catch (error: any) {
      this.logger.error('Error reading the icons folder:', error);
      return []; // Return an empty array in case of an error
    }
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveCache() {
    try {
      await fs.mkdir(path.dirname(this.CACHE_FILE_PATH), { recursive: true });
      await fs.writeFile(
        this.CACHE_FILE_PATH,
        JSON.stringify(this.imageCache, null, 2),
      );
      this.logger.log('Cache saved to file.');
    } catch (error: any) {
      this.logger.error('Error saving cache to file:', error);
    }
  }

  private async loadCache() {
    try {
      const data = await fs.readFile(this.CACHE_FILE_PATH, 'utf-8');
      this.imageCache = JSON.parse(data);
      this.logger.log('Cache loaded from file.');
    } catch (error: any) {
      this.logger.error('Error loading cache from file:', error);
    }
  }

  async steamKeys() {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '..', 'boffmedia-b6e4f721c326.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = (await auth.getClient()) as any;
    const sheets = google.sheets({
      version: 'v4',
      auth: client,
    }) as sheets_v4.Sheets;

    const spreadsheetId = '1mQopLvsmDuz5iHJ9WVN5NLH78UsKrK6E364v3i8a00c';
    const range = 'A2:F';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    const steamKeys = await Promise.all(
      (rows ?? []).map(async (row) => {
        const steamID = row[5];
        let imageUrl = '';

        if (steamID) {
          imageUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamID}/header.jpg`;
        } else {
          imageUrl = '/assets/img/steam.webp';
        }

        return {
          name: row[0],
          source: row[1],
          claimed: row[3],
          steamID,
          imageUrl,
        };
      }),
    );

    return steamKeys;
  }

  async getSteamData(steamID: string): Promise<GameData> {
    this.logger.log('GETSTEAMDATA= ' + steamID);
    const url = `https://store.steampowered.com/api/appdetails?appids=${steamID}&l=spanish`;
    const response = await axios.get(url);
    const gameData = response.data[steamID].data;

    this.logger.log(gameData);

    const initialPrice = gameData.price_overview?.initial;
    const finalPrice = gameData.price_overview?.final;

    const initialFormatted = initialPrice ? `${initialPrice / 100} €` : 'N/A';
    const finalFormatted = finalPrice ? `${finalPrice / 100} €` : 'N/A';

    const trailers = gameData.movies || ([] as Video[]);
    const screenshots = gameData.screenshots || ([] as Image[]);

    const media = [...trailers, ...screenshots] as (Video | Image)[];

    const movies = gameData.movies ?? [];

    const trailerImages = movies
      .map((movie: any) => movie?.hls_h264)
      .filter(Boolean);

    const data = {
      steamID,
      name: gameData.name,
      normalPrice: initialFormatted,
      currentPrice: finalFormatted,
      discountPercent: gameData.price_overview?.discount_percent || 0,
      trailerImages,
      genres: gameData.genres?.map((genre: any) => genre.description) || [],
      description: gameData.detailed_description,
      shortDescription: gameData.short_description,
      headerImage: gameData.header_image,
      screenshots:
        gameData.screenshots?.map((screenshot: any) => screenshot.path_full) ||
        [],
      releaseDate: gameData.release_date?.date,
      developers: gameData.developers || [],
      publishers: gameData.publishers || [],
      platforms: gameData.platforms || {
        windows: false,
        mac: false,
        linux: false,
      },
      categories:
        gameData.categories?.map((category: any) => category.description) || [],
      website: gameData.website || '',

      media: media,
    };

    this.logger.log('== RESULTADO ==');
    this.logger.log(data);

    return data;
  }

  /* ── Steam · currently-free promos ─────────────────────────────────────────
   * The source of truth for "what is 100 % off right now" is the store search
   * the tool links to (`maxprice=free&specials=1&category1=998`). Its JSON
   * payload carries only markup, so we pull the appids out of it and hand them
   * to IStoreBrowseService/GetItems — the only public endpoint that exposes
   * `free_to_keep_ends`, i.e. the deadline to claim. appdetails does not.
   */

  /** Promos change on Steam's schedule, not per request — cache per lang+cc. */
  private readonly steamFreeCache = new Map<
    string,
    { at: number; data: SteamFreeResult }
  >();

  async getSteamFreeGames(locale?: string): Promise<SteamFreeResult> {
    const lang = STEAM_LANG[(locale ?? '').toLowerCase()] ?? STEAM_LANG.es;
    const cacheKey = `${lang}:${STEAM_COUNTRY}`;
    const cached = this.steamFreeCache.get(cacheKey);
    if (cached && Date.now() - cached.at < STEAM_FREE_TTL_MS)
      return cached.data;

    let appIds: string[];
    try {
      appIds = await this.fetchSteamFreeAppIds(lang);
    } catch (err: any) {
      // A stale list beats an empty page when the store hiccups.
      this.logger.error(`steamfree: search failed — ${err?.message}`);
      if (cached) return cached.data;
      throw err;
    }

    const games = appIds.length
      ? await this.fetchSteamStoreItems(appIds, lang)
      : [];

    // Soonest deadline first — the whole point of the tool is "claim before".
    games.sort((a, b) => {
      if (a.freeToKeepEnds !== b.freeToKeepEnds) {
        if (a.freeToKeepEnds == null) return 1;
        if (b.freeToKeepEnds == null) return -1;
        return a.freeToKeepEnds - b.freeToKeepEnds;
      }
      return a.name.localeCompare(b.name);
    });

    const data: SteamFreeResult = {
      games,
      count: games.length,
      fetchedAt: new Date().toISOString(),
      searchUrl: STEAM_FREE_SEARCH_URL,
    };
    this.steamFreeCache.set(cacheKey, { at: Date.now(), data });
    return data;
  }

  /** Scrapes only `data-ds-appid` — the one attribute in that markup that is
   *  a stable contract rather than presentation. */
  private async fetchSteamFreeAppIds(lang: string): Promise<string[]> {
    const res = await axios.get(
      'https://store.steampowered.com/search/results/',
      {
        params: {
          query: '',
          start: 0,
          count: 100,
          sort_by: '_ASC',
          maxprice: 'free',
          category1: 998,
          specials: 1,
          infinite: 1,
          cc: STEAM_COUNTRY,
          l: lang,
        },
        headers: { 'User-Agent': STEAM_UA },
        timeout: 15_000,
      },
    );
    const html = String(res.data?.results_html ?? '');
    const ids = new Set<string>();
    for (const m of html.matchAll(/data-ds-appid="([\d,]+)"/g)) {
      for (const id of m[1].split(',')) if (id) ids.add(id);
    }
    return [...ids];
  }

  private async fetchSteamStoreItems(
    appIds: string[],
    lang: string,
  ): Promise<SteamFreeGame[]> {
    const out: SteamFreeGame[] = [];
    for (let i = 0; i < appIds.length; i += 50) {
      const input = {
        ids: appIds.slice(i, i + 50).map((id) => ({ appid: Number(id) })),
        context: {
          language: lang,
          country_code: STEAM_COUNTRY,
          steam_realm: 1,
        },
        data_request: {
          include_assets: true,
          include_release: true,
          include_platforms: true,
          include_basic_info: true,
          include_reviews: true,
        },
      };
      const res = await axios.get(
        'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/',
        {
          params: { input_json: JSON.stringify(input) },
          headers: { 'User-Agent': STEAM_UA },
          timeout: 15_000,
        },
      );
      for (const item of res.data?.response?.store_items ?? []) {
        const mapped = mapSteamStoreItem(item);
        if (mapped) out.push(mapped);
      }
    }
    return out;
  }
}

export interface Image {
  id: number;
  path_thumbnail: string;
  path_full: string;
}

export interface Video {
  id: number;
  name: string;
  thumbnail: string;
  webm: {
    '480': string;
    max: string;
  };

  mp4: {
    '480': string;
    max: string;
  };

  highlight: boolean;
}

export interface GameData {
  name: string;
  normalPrice: string;
  currentPrice: string;
  discountPercent: number;
  trailerImages: string[];
  genres: string[];
  description: string;
  shortDescription: string;
  headerImage: string;
  screenshots: string[];
  releaseDate: string;
  developers: string[];
  publishers: string[];
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories: string[];
  website: string;

  media: (Video | Image)[];
}

/* ── Steam free-promo helpers ─────────────────────────────────────────────── */

const STEAM_FREE_TTL_MS = 10 * 60 * 1000;
const STEAM_COUNTRY = 'ES';
const STEAM_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const STEAM_LANG: Record<string, string> = {
  es: 'spanish',
  en: 'english',
};
/** The human-facing page this endpoint mirrors — echoed back so the UI can link it. */
const STEAM_FREE_SEARCH_URL =
  'https://store.steampowered.com/search/?sort_by=_ASC&hwtype=0&maxprice=free&category1=998&specials=1';
const STEAM_ASSET_BASE =
  'https://shared.fastly.steamstatic.com/store_item_assets/';

function steamAsset(assets: any, file?: string): string {
  const fmt = assets?.asset_url_format;
  if (!fmt || !file) return '';
  return STEAM_ASSET_BASE + String(fmt).replace('${FILENAME}', file);
}

function mapSteamStoreItem(item: any): SteamFreeGame | null {
  if (!item || item.success !== 1 || !item.appid) return null;
  const buy = item.best_purchase_option ?? {};
  // `summary_filtered` is the all-languages score; the language-specific one is
  // a much smaller sample, so it is only a fallback.
  const rev =
    item.reviews?.summary_filtered ??
    item.reviews?.summary_language_specific ??
    {};
  const p = item.platforms ?? {};
  const release = Number(item.release?.steam_release_date ?? 0);

  return {
    steamID: String(item.appid),
    name: item.name ?? '',
    storeUrl: `https://store.steampowered.com/app/${item.appid}/`,
    headerImage: steamAsset(item.assets, item.assets?.header),
    capsuleImage: steamAsset(
      item.assets,
      item.assets?.main_capsule ?? item.assets?.small_capsule,
    ),
    libraryImage: steamAsset(item.assets, item.assets?.library_capsule),
    shortDescription: item.basic_info?.short_description ?? '',
    developers: (item.basic_info?.developers ?? [])
      .map((d: any) => d?.name)
      .filter(Boolean),
    publishers: (item.basic_info?.publishers ?? [])
      .map((d: any) => d?.name)
      .filter(Boolean),
    releaseDate: release ? new Date(release * 1000).toISOString() : null,
    platforms: {
      windows: !!p.windows,
      mac: !!p.mac,
      linux: !!(p.steamos_linux ?? p.linux),
    },
    normalPrice:
      buy.formatted_original_price ?? buy.formatted_final_price ?? '',
    currentPrice: buy.formatted_final_price ?? '',
    originalPriceCents: Number(buy.original_price_in_cents ?? 0) || 0,
    discountPercent: Number(buy.discount_pct ?? 0) || 0,
    /** True = yours forever once claimed. False = a free *weekend*, not a keep. */
    isFreeToKeep: !!buy.is_free_to_keep,
    isFreeTemporarily: !!item.is_free_temporarily,
    /** Unix seconds; null when Steam does not publish a deadline. */
    freeToKeepEnds: Number(buy.free_to_keep_ends ?? 0) || null,
    reviewLabel: rev.review_score_label ?? null,
    reviewPercentPositive: Number(rev.percent_positive ?? 0) || null,
    reviewCount: Number(rev.review_count ?? 0) || null,
  };
}

export interface SteamFreeGame {
  steamID: string;
  name: string;
  storeUrl: string;
  headerImage: string;
  capsuleImage: string;
  libraryImage: string;
  shortDescription: string;
  developers: string[];
  publishers: string[];
  releaseDate: string | null;
  platforms: { windows: boolean; mac: boolean; linux: boolean };
  normalPrice: string;
  currentPrice: string;
  originalPriceCents: number;
  discountPercent: number;
  isFreeToKeep: boolean;
  isFreeTemporarily: boolean;
  freeToKeepEnds: number | null;
  reviewLabel: string | null;
  reviewPercentPositive: number | null;
  reviewCount: number | null;
}

export interface SteamFreeResult {
  games: SteamFreeGame[];
  count: number;
  /** ISO — when this snapshot was pulled from Steam (may be up to 10 min old). */
  fetchedAt: string;
  searchUrl: string;
}
