import { ASSET, joinAssetPath } from '@boffmedia/asset-paths';

import { env } from './env';

export { ASSET };

/**
 * Absolute URL for an asset the API hands to a client, built from one of the
 * {@link ASSET} prefixes. The only place allowed to join PUBLIC_DIR with an
 * asset path.
 *
 * Values persisted to the database stay RELATIVE (the `joinAssetPath` result on
 * its own): an absolute URL freezes today's origin into every stored row, so
 * moving the assets to another host would require a data migration.
 */
export function assetUrl(prefix: string, ...segments: string[]): string {
  const path = joinAssetPath(prefix, ...segments);
  return `${(env.PUBLIC_DIR ?? '').replace(/\/+$/, '')}${path}`;
}

/**
 * The stored, root-relative asset path as an ABSOLUTE url, for the one kind of
 * client that cannot use a relative one: something not served from our origin
 * at all. The launcher's webview runs on `tauri://localhost`, where
 * `/uploads/x.png` fetches nothing.
 *
 * THE TWO TREES ARE MOUNTED DIFFERENTLY, and that is the whole of this
 * function. `main.ts` serves the writable uploads store at the server ROOT
 * (`app.use('/uploads', ...)`), while the read-only tree is served by
 * `ServeStaticModule` under a `/public` serve-root. PUBLIC_DIR points at the
 * latter — it ends in `/public` in a real deployment — so prefixing it onto an
 * uploads path yields `/public/uploads/...`, which is a 404 on every host. That
 * was a live bug: the launcher logged exactly that url as undownloadable.
 *
 *   /uploads/…   ->  <origin of PUBLIC_DIR>/uploads/…
 *   everything else -> <PUBLIC_DIR>/…
 *
 * The WEB_URL fallback needs no such split: the website serves the read-only
 * tree from its own `public/` AND proxies `/uploads/*` to this API (see
 * `apps/web/next.config.mjs`), so both shapes resolve against it unchanged.
 *
 * Returns null when neither variable is a usable absolute origin. A caller must
 * treat that as "no url", never build a relative one — that is the failure this
 * exists to prevent, and it is invisible until a client off our origin tries it.
 */
export function absoluteAssetUrl(storedPath: string): string | null {
  const path = `/${String(storedPath).replace(/^\/+/, '')}`;

  const publicDir = absoluteOrigin(env.PUBLIC_DIR);
  if (publicDir) {
    const base = isUploadsPath(path) ? originOf(publicDir) : publicDir;
    return base ? `${base}${path}` : null;
  }

  const web = absoluteOrigin(env.WEB_URL);
  return web ? `${web}${path}` : null;
}

/** `/uploads` is the ONE prefix in {@link ASSET} whose bytes are written while
 *  the app runs, which is why it lives outside the read-only tree and is served
 *  from a different mount. Derived from ASSET rather than hardcoded so a rename
 *  there cannot silently stop matching. */
const UPLOADS_PREFIX = `/${Object.values(ASSET.uploads)[0].split('/')[1]}`;

function isUploadsPath(path: string): boolean {
  return path === UPLOADS_PREFIX || path.startsWith(`${UPLOADS_PREFIX}/`);
}

/** Trimmed, and only when it really is an absolute http(s) base. PUBLIC_DIR's
 *  NAME says directory and `assetUrl` will prefix any string happily, so a
 *  value like `/public` is a plausible misconfiguration — and prefixing it
 *  produces a url that is STILL relative, failing in the hardest way to spot. */
function absoluteOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, '');
}

/** Scheme and host only, dropping any path — `http://h/public` -> `http://h`. */
function originOf(base: string): string | null {
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}
