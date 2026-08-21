// ---------------------------------------------------------------------------
// MangaBrowserService — owns the single shared Playwright Chromium instance.
//
// Both MangaDownloadService (chapter images) and scrapers (Playwright fallback
// for search / chapter lists when axios is blocked) share this browser.
// ---------------------------------------------------------------------------

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import WebSocket from 'ws';
import { env } from '@/config/env';

// A tunnel that never answers must fail the request rather than hold it open:
// the caller's own timeout is what used to expire first, after two minutes.
const TUNNEL_CONNECT_TIMEOUT_MS = 15_000;

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
    return !!env.MANGA_BROWSER_WS_ENDPOINT;
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
      this.logger.log(
        `Tunnel ${enabled ? 'enabled' : 'disabled'} — closing current browser instance`,
      );
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  // ── Browser lifecycle ─────────────────────────────────────────────────────

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      const wsEndpoint = env.MANGA_BROWSER_WS_ENDPOINT;
      if (this.useTunnel && wsEndpoint) {
        this.logger.log(`Connecting to remote browser (tunnel): ${wsEndpoint}`);
        await this.assertTunnelReachable(wsEndpoint);
        try {
          this.browser = await chromium.connect(wsEndpoint, {
            timeout: TUNNEL_CONNECT_TIMEOUT_MS,
          });
        } catch (error: any) {
          this.browser = null;
          throw new ServiceUnavailableException(
            `Remote browser tunnel is unreachable: ${error?.message ?? 'connection failed'}`,
          );
        }
      } else {
        if (this.useTunnel && !wsEndpoint) {
          this.logger.warn(
            'Tunnel enabled but MANGA_BROWSER_WS_ENDPOINT is not set — falling back to local browser',
          );
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
      // A dropped transport reaches us as an 'error' on Playwright's ws client,
      // which is an EventEmitter: with no listener Node treats it as fatal and
      // takes the whole API down, so a scraper tunnel going away must never be
      // left unhandled. The browser is also cleared, because a disconnected one
      // would otherwise be handed to the next caller.
      this.browser.on('disconnected', () => {
        this.logger.warn(
          'Browser disconnected — it will be reconnected on next use',
        );
        this.browser = null;
      });
    }
    return this.browser;
  }

  /**
   * Opens and closes the tunnel ourselves before handing the endpoint to
   * Playwright.
   *
   * A failed WebSocket handshake surfaces as an 'error' event rather than a
   * rejected promise, and Playwright's transport does not always have a
   * listener attached when it fires. An unhandled 'error' on an EventEmitter is
   * fatal to the process, so an unreachable scraper tunnel would otherwise take
   * the whole API down with it. This probe owns its listeners, so the same
   * failure becomes a 503 on one request.
   */
  private assertTunnelReachable(wsEndpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const probe = new WebSocket(wsEndpoint);
      const settle = (error?: Error) => {
        clearTimeout(timer);
        probe.removeAllListeners();
        try {
          probe.terminate();
        } catch {
          /* already closed */
        }
        if (error) reject(error);
        else resolve();
      };
      const timer = setTimeout(
        () =>
          settle(
            new ServiceUnavailableException(
              `Remote browser tunnel did not answer within ${TUNNEL_CONNECT_TIMEOUT_MS}ms`,
            ),
          ),
        TUNNEL_CONNECT_TIMEOUT_MS,
      );
      probe.on('open', () => settle());
      probe.on('error', (error: Error) =>
        settle(
          new ServiceUnavailableException(
            `Remote browser tunnel is unreachable: ${error?.message ?? 'connection failed'}`,
          ),
        ),
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
