// ---------------------------------------------------------------------------
// MangaBrowserService — owns the single shared Playwright Chromium instance.
//
// Both MangaDownloadService (chapter images) and scrapers (Playwright fallback
// for search / chapter lists when axios is blocked) share this browser.
// ---------------------------------------------------------------------------

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, Browser } from 'playwright';

@Injectable()
export class MangaBrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(MangaBrowserService.name);
  private browser: Browser | null = null;

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching Chromium browser…');
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
