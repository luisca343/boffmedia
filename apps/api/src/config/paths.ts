import { join } from 'path';

import { env } from './env';

/**
 * Absolute path inside the read-only asset tree (`<cwd>/public` unless
 * PUBLIC_ROOT overrides it). Everything under it is either content-addressed or
 * placed by hand, so the API may read from here but must never write: a bind
 * mount can be mounted read-only, and the whole tree is disposable and
 * reproducible only as long as nothing at runtime adds to it.
 *
 * Runtime output belongs in {@link laboonPath} instead.
 */
export function publicPath(...segments: string[]): string {
  return join(env.PUBLIC_ROOT ?? join(process.cwd(), 'public'), ...segments);
}

/**
 * Absolute path inside the laboon store — network-attached storage (a Hetzner
 * StorageBox) mounted at `<cwd>/laboon`: apps/api/laboon in dev via the
 * boffmedia-mounts bind, /app/laboon in Docker.
 *
 * Suited to large, cold, sequentially-read blobs — release binaries, pack
 * blobs, ROMs, manga, backups. Being network storage, every operation costs a
 * round trip and the mount enforces a concurrent-connection limit, so nothing
 * served on a per-request path belongs here: hot user content goes through
 * {@link uploadsPath} instead.
 *
 * TEMP: the pack-blob and launcher-release stores call this directly instead of
 * reading PACK_BLOB_DIR / DESKTOP_RELEASE_DIR, so uploads work with zero env
 * setup. Restore an `env.X ?? laboonPath(...)` override once the deploy env is
 * wired.
 *
 * If you do restore it, restore it in BOTH stores at once. Half-migrating it —
 * one store reading the env var while the other does not — breaks every upload
 * in a host dev run, where the env holds the container's `/app/...` path that
 * the host process cannot create (`EACCES: mkdir '/app'`).
 */
export function laboonPath(...segments: string[]): string {
  return join(process.cwd(), 'laboon', ...segments);
}

/**
 * Absolute path inside the writable uploads store (`UPLOADS_ROOT`, else
 * `<cwd>/var/uploads`). Small files that are written once and then read on
 * ordinary page loads — avatars, chat images, ShareX captures — so it must be
 * local disk rather than {@link laboonPath}'s network storage.
 *
 * Separate from {@link publicPath} because these bytes arrive at runtime: the
 * asset tree stays reproducible and can be mounted read-only.
 */
export function uploadsPath(...segments: string[]): string {
  return join(
    env.UPLOADS_ROOT ?? join(process.cwd(), 'var', 'uploads'),
    ...segments,
  );
}
