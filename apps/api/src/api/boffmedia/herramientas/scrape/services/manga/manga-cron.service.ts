import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { MangaConfigService } from './manga-config.service';
import { MangaDownloadService } from './manga-download.service';

@Injectable()
export class MangaCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MangaCronService.name);
  private cronJob: CronJob | null = null;

  constructor(
    private readonly configService: MangaConfigService,
    private readonly downloadService: MangaDownloadService,
  ) {}

  async onModuleInit() {
    await this.syncCronJob();
  }

  onModuleDestroy() {
    this.cronJob?.stop();
  }

  /** Creates or destroys the cron job based on current config. Call after updating cron settings. */
  async syncCronJob(): Promise<void> {
    this.cronJob?.stop();
    this.cronJob = null;

    const config = this.configService.getConfig();
    if (!config.cron.enabled) {
      this.logger.log('Manga auto-update cron is disabled.');
      return;
    }

    try {
      this.cronJob = new CronJob(config.cron.schedule, () => {
        this.runAutoUpdate().catch((err) =>
          this.logger.error(`Cron auto-update error: ${(err as Error).message}`),
        );
      });
      this.cronJob.start();
      this.logger.log(`Manga auto-update cron scheduled: ${config.cron.schedule}`);
    } catch (err) {
      this.logger.error(`Invalid cron expression "${config.cron.schedule}": ${(err as Error).message}`);
    }
  }

  async runAutoUpdate(): Promise<{ checked: number; failed: string[] }> {
    this.logger.log('Starting manga auto-update…');
    const ongoing = this.configService.getOngoingSeries();

    if (ongoing.length === 0) {
      this.logger.log('No ongoing series to check.');
      return { checked: 0, failed: [] };
    }

    const failed: string[] = [];

    for (const { slug, sourceUrl } of ongoing) {
      this.logger.log(`Checking ${slug} for new chapters…`);
      try {
        // Consume the SSE stream to trigger the download
        for await (const _event of this.downloadService.streamDownloadNovel(sourceUrl, 1, undefined, true)) {
          // events are ignored; download happens as a side effect
        }
        await this.configService.markLastChecked(slug);
      } catch (err) {
        this.logger.error(`Auto-update failed for ${slug}: ${(err as Error).message}`);
        failed.push(slug);
      }
    }

    this.logger.log(`Manga auto-update complete. Checked: ${ongoing.length}, failed: ${failed.length}`);
    return { checked: ongoing.length, failed };
  }
}
