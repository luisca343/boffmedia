import { ASSET, joinAssetPath } from '@boffmedia/asset-paths';

/**
 * Avatar shown until a user uploads one. Stored relative, like every other
 * asset path in the database, so the tree can change origin without a data
 * migration — the file itself lives in the read-only asset tree because it is
 * shipped content, not something the app writes.
 *
 * The column default in `_db/schema/BoffMedia.ts` repeats this value as a
 * literal because a SQL default cannot call into application code; the two must
 * stay in step.
 */
export const DEFAULT_PROFILE_PICTURE = joinAssetPath(
  ASSET.boffmedia.img,
  'profile.png',
);
