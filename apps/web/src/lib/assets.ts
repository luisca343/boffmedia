import { ASSET, joinAssetPath } from '@boffmedia/asset-paths';

import { env } from '@/config/env.public';

export { ASSET };

/**
 * Build a URL for a static asset, from one of the {@link ASSET} prefixes plus
 * any further path segments. The single place allowed to turn an asset prefix
 * into a URL — never hand-build asset path strings elsewhere, or the origin
 * below cannot move without touching every call site.
 *
 * The result is root-relative while NEXT_PUBLIC_STATIC_URL is unset: Next serves
 * the asset tree itself, and `/uploads` reaches the API through the rewrite in
 * next.config.mjs. Pointing that variable at a dedicated asset host is the only
 * change needed to serve every asset from somewhere else.
 */
export function staticAsset(prefix: string, ...segments: string[]): string {
  const base = (env.NEXT_PUBLIC_STATIC_URL ?? '').replace(/\/+$/, '');
  return `${base}${joinAssetPath(prefix, ...segments)}`;
}

/**
 * Resolve an ALREADY-BUILT root-relative asset path, for callers holding a path
 * rather than a prefix plus segments — `@boffmedia/ui`'s `assetUrl` seam, whose
 * packages build the path with `joinAssetPath` and hand it over resolved by the
 * host. Same origin rule as {@link staticAsset}, expressed once.
 */
export function staticAssetUrl(path: string): string {
  const base = (env.NEXT_PUBLIC_STATIC_URL ?? '').replace(/\/+$/, '');
  return `${base}${path}`;
}
