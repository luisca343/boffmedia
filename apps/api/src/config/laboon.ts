import { join } from 'path';

/**
 * Absolute path inside the laboon store — the 10TB HDD bind-mounted at
 * `<cwd>/laboon` (apps/api/laboon in dev via the boffmedia-mounts bind,
 * /app/laboon in Docker). Large binaries live here, never on the container's
 * ephemeral writable layer.
 *
 * TEMP: the pack-blob and launcher-release stores call this directly instead of
 * reading PACK_BLOB_DIR / LAUNCHER_RELEASE_DIR, so uploads work with zero env
 * setup. Restore an `env.X ?? laboonPath(...)` override once the deploy env is
 * wired.
 *
 * If you do restore it, restore it in BOTH stores at once. Half-migrating it —
 * pack blobs read the env var, launcher releases did not — meant a host dev run
 * (where the env holds the container's `/app/...` path) failed every ROM upload
 * with `EACCES: mkdir '/app'` while launcher uploads kept working.
 */
export function laboonPath(...segments: string[]): string {
  return join(process.cwd(), 'laboon', ...segments);
}
