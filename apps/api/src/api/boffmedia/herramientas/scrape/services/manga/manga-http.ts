// ---------------------------------------------------------------------------
// Shared HTTP utilities for manga scrapers.
// ---------------------------------------------------------------------------

import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import pino from 'pino';
import { env } from '@/config/env';

const logger = pino({ name: 'util' });

// ── Proxy pool ─────────────────────────────────────────────────────────────

const PROXY_POOL_TTL_MS = 10 * 60 * 1_000; // 10 minutes

let proxyPool: string[] | null = null;
let proxyPoolLoadedAt = 0;

/**
 * Lazily fetches and parses the proxy list from MANGA_SCRAPER_PROXY_LIST_URL.
 * Each line must be in `host:port:user:pass` format (Webshare direct format).
 * The pool is refreshed after PROXY_POOL_TTL_MS (10 minutes).
 * Returns an empty array if the env var is not set or the fetch fails.
 */
async function loadProxyPool(): Promise<string[]> {
  if (proxyPool !== null && Date.now() - proxyPoolLoadedAt < PROXY_POOL_TTL_MS)
    return proxyPool;

  const listUrl = env.MANGA_SCRAPER_PROXY_LIST_URL;
  if (!listUrl) {
    proxyPool = [];
    return proxyPool;
  }

  try {
    const { data } = await axios.get<string>(listUrl, { timeout: 10_000 });
    proxyPool = data
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes(':'))
      .map((l) => {
        const [host, port, user, pass] = l.split(':');
        return `http://${user}:${pass}@${host}:${port}`;
      });
    proxyPoolLoadedAt = Date.now();
    logger.info(`[manga-http] Loaded ${proxyPool.length} proxies from pool`);
  } catch (err) {
    logger.warn(
      `[manga-http] Failed to load proxy list: ${(err as Error).message}`,
    );
    proxyPool = [];
  }

  return proxyPool;
}

/**
 * Returns a random proxy URL from the pool, or the MANGA_SCRAPER_PROXY
 * single-proxy env var as fallback, or undefined if nothing is configured.
 */
export async function getProxy(): Promise<string | undefined> {
  const pool = await loadProxyPool();
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return env.MANGA_SCRAPER_PROXY || undefined;
}

/**
 * Returns up to N distinct random proxies from the pool.
 * Falls back to [MANGA_SCRAPER_PROXY] if the pool is empty.
 */
export async function getProxies(n = 3): Promise<string[]> {
  const pool = await loadProxyPool();
  if (pool.length === 0) {
    const single = env.MANGA_SCRAPER_PROXY;
    return single ? [single] : [];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Parses a proxy URL (http://user:pass@host:port) into Playwright's proxy
 * config shape, which requires credentials as separate fields.
 */
export function toPlaywrightProxy(proxyUrl: string): {
  server: string;
  username?: string;
  password?: string;
} {
  const parsed = new URL(proxyUrl);
  return {
    server: `${parsed.protocol}//${parsed.hostname}:${parsed.port}`,
    ...(parsed.username
      ? { username: decodeURIComponent(parsed.username) }
      : {}),
    ...(parsed.password
      ? { password: decodeURIComponent(parsed.password) }
      : {}),
  };
}

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const DELAY_MS = { min: 300, max: 800 };
export const MAX_RETRIES = 2;

/** Minimum byte size for a response to be considered non-empty. */
const MIN_HTML_BYTES = 3_000;

/** Markers that indicate novelcool has flagged/blocked this request. */
const BLOCK_MARKERS = ['novelcool_bad_user_4', 'bad_user'];

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(): Promise<void> {
  const ms = DELAY_MS.min + Math.random() * (DELAY_MS.max - DELAY_MS.min);
  return sleep(ms);
}

/** Simple fetch — minimal headers, throws on HTTP error. Used by Playwright path. */
export async function fetchHtml(url: string): Promise<string> {
  const { data } = await axios.get<string>(url, {
    headers: { 'User-Agent': UA },
    timeout: 15_000,
  });
  return data;
}

/**
 * Realistic browser-like fetch with bot-detection validation.
 *
 * Returns `null` when the response is considered invalid:
 *   - Too small (< MIN_HTML_BYTES) — likely a block page or redirect shell
 *   - Contains a bot-detection cookie marker (e.g. `novelcool_bad_user_4`)
 *   - Contains Cloudflare / CAPTCHA challenge markers
 *
 * @param url      Target URL
 * @param proxyUrl Optional HTTP/HTTPS proxy URL (e.g. `http://user:pass@host:port`)
 */
export async function fetchHtmlSafe(
  url: string,
  proxyUrl?: string,
): Promise<string | null> {
  const config: AxiosRequestConfig = {
    headers: {
      'User-Agent': UA,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    },
    timeout: 20_000,
    maxRedirects: 5,
  };

  if (proxyUrl) {
    // Parse proxy URL into axios proxy config (no external package needed).
    const parsed = new URL(proxyUrl);
    config.proxy = {
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname,
      port: Number(parsed.port),
      ...(parsed.username
        ? { auth: { username: parsed.username, password: parsed.password } }
        : {}),
    };
  }

  let html: string;
  try {
    const { data } = await axios.get<string>(url, config);
    html = typeof data === 'string' ? data : JSON.stringify(data);
  } catch {
    return null;
  }

  // Reject responses that are clearly not real content pages.
  if (html.length < MIN_HTML_BYTES) return null;

  const lower = html.toLowerCase();
  if (BLOCK_MARKERS.some((m) => lower.includes(m))) return null;
  if (lower.includes('cf-browser-verification') || lower.includes('_cf_chl_'))
    return null;
  if (lower.includes('captcha')) return null;

  return html;
}
