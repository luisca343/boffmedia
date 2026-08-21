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
  const base = (env.PUBLIC_DIR ?? '').replace(/\/+$/, '');
  return `${base}${path}`;
}
