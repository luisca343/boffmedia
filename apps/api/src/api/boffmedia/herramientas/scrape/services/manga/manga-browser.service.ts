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

  /**
   * Whether to connect to the remote browser tunnel (MANGA_BROWSER_WS_ENDPOINT).
   * Defaults to false — local Chromium is used unless explicitly enabled.
   */
  private useTunnel = false;

  // ── Tunnel toggle ─────────────────────────────────────────────────────────

  tunnelAvailable(): boolean {
    return !!process.env.MANGA_BROWSER_WS_ENDPOINT;
  }

  getTunnelEnabled(): boolean {
    return this.useTunnel;
  }

  async setTunnelEnabled(enabled: boolean): Promise<void> {
    if (enabled === this.useTunnel) return;
    this.useTunnel = enabled;
    // Close the existing browser so the next getBrowser() call reconnects
    // with the new mode (local ↔ remote).
    if (this.browser) {
      this.logger.log(`Tunnel ${enabled ? 'enabled' : 'disabled'} — closing current browser instance`);
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  // ── Browser lifecycle ─────────────────────────────────────────────────────

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      const wsEndpoint = process.env.MANGA_BROWSER_WS_ENDPOINT;
      if (this.useTunnel && wsEndpoint) {
        this.logger.log(`Connecting to remote browser (tunnel): ${wsEndpoint}`);
        this.browser = await chromium.connect(wsEndpoint);
      } else {
        if (this.useTunnel && !wsEndpoint) {
          this.logger.warn('Tunnel enabled but MANGA_BROWSER_WS_ENDPOINT is not set — falling back to local browser');
        }
        this.logger.log('Launching local Chromium browser…');
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
