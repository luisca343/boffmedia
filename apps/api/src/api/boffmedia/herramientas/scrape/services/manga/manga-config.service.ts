import { Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile, mkdir } from 'fs/promises';
import * as path from 'path';
import { MANGA_ROOT } from './manga-constants';

export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus';

export interface SeriesConfig {
  sourceUrl?: string;
  status?: SeriesStatus;
  lastChecked?: string;
}

export interface CronConfig {
  enabled: boolean;
  schedule: string;
}

export interface MangaConfig {
  cron: CronConfig;
  series: Record<string, SeriesConfig>;
}

const DEFAULT_CONFIG: MangaConfig = {
  cron: { enabled: false, schedule: '0 3 * * *' },
  series: {},
};

const CONFIG_PATH = path.join(MANGA_ROOT, 'manga.config.json');

@Injectable()
export class MangaConfigService {
  private readonly logger = new Logger(MangaConfigService.name);
  private config: MangaConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  async onModuleInit() {
    this.config = await this.load();
  }

  getConfig(): MangaConfig {
    return this.config;
  }

  async updateCron(patch: Partial<CronConfig>): Promise<MangaConfig> {
    this.config.cron = { ...this.config.cron, ...patch };
    await this.save();
    return this.config;
  }

  async updateSeriesConfig(
    slug: string,
    patch: Partial<SeriesConfig>,
  ): Promise<SeriesConfig> {
    this.config.series[slug] = {
      ...(this.config.series[slug] ?? {}),
      ...patch,
    };
    await this.save();
    return this.config.series[slug];
  }

  async setSourceUrlIfMissing(slug: string, sourceUrl: string): Promise<void> {
    if (!this.config.series[slug]?.sourceUrl) {
      await this.updateSeriesConfig(slug, { sourceUrl, status: 'ongoing' });
    }
  }

  getOngoingSeries(): Array<{ slug: string; sourceUrl: string }> {
    return Object.entries(this.config.series)
      .filter(([, cfg]) => cfg.status === 'ongoing' && !!cfg.sourceUrl)
      .map(([slug, cfg]) => ({ slug, sourceUrl: cfg.sourceUrl! }));
  }

  async markLastChecked(slug: string): Promise<void> {
    await this.updateSeriesConfig(slug, {
      lastChecked: new Date().toISOString(),
    });
  }

  private async load(): Promise<MangaConfig> {
    try {
      const raw = await readFile(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<MangaConfig>;
      return {
        cron: { ...DEFAULT_CONFIG.cron, ...(parsed.cron ?? {}) },
        series: parsed.series ?? {},
      };
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }

  private async save(): Promise<void> {
    try {
      await mkdir(MANGA_ROOT, { recursive: true });
      await writeFile(
        CONFIG_PATH,
        JSON.stringify(this.config, null, 2),
        'utf-8',
      );
    } catch (err) {
      this.logger.error(
        `Failed to save manga config: ${(err as Error).message}`,
      );
    }
  }
}
