import { absoluteAssetUrl } from '@/config/asset-url';
import { DEFAULT_PROFILE_PICTURE } from '@api/boffmedia/users/users.constants';

/**
 * The Boffmedia avatar, as an absolute URL the launcher can actually fetch.
 *
 * Three things have to be got right here, and each of them was wrong the
 * obvious way first.
 *
 * ORIGIN. `profile_picture` is stored RELATIVE, like every asset path in the
 * database (see `config/asset-url.ts` — an absolute URL would freeze today's
 * host into every row). The website can render that as-is; the launcher cannot,
 * because on `tauri://localhost` a root-relative path resolves against the
 * custom protocol and fetches nothing. `absoluteAssetUrl` owns which base each
 * tree needs — an uploaded avatar and the shipped default are served from
 * DIFFERENT mounts, and getting that wrong is a 404, not a fallback.
 *
 * OAUTH URLS. Discord/Twitch/Google hand us their own absolute CDN url on
 * sign-up, so the column holds both shapes. Those pass through untouched:
 * prefixing an origin onto one produces a 404 for every social account, and
 * appending anything to one risks invalidating a signed url.
 *
 * FRESHNESS. Uploaded avatars are overwritten IN PLACE under a url keyed by
 * user id, so the url alone is not a version — and the launcher's icon cache
 * (icons.rs) is content-addressed by url and never expires. Without the
 * `updatedAt` token a player who changed their avatar would keep seeing the old
 * face on that machine forever. The token only goes on our own paths; a CDN url
 * already changes when the picture does.
 *
 * Null means "never set one" — the shipped default included. The launcher draws
 * its monogram then, which keeps several accounts distinguishable where a
 * shared silhouette would not.
 */
export function desktopAvatarUrl(
  profilePicture: string | null | undefined,
  updatedAt?: Date | string | number | null,
): string | null {
  const raw = profilePicture?.trim();
  if (!raw) return null;
  if (raw === DEFAULT_PROFILE_PICTURE) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  // No usable origin means anything built here would come out relative, which
  // the launcher cannot fetch at all. A monogram is the honest answer then; a
  // URL that is certain to 404 is not.
  const url = absoluteAssetUrl(raw);
  if (!url) return null;

  const version = avatarVersion(updatedAt);
  return version ? `${url}?v=${version}` : url;
}

/** Milliseconds since the epoch, or null when there is nothing usable to stamp
 *  with. An unparseable date must not become `?v=NaN`, which would be a fresh
 *  cache key on every call and defeat the cache entirely. */
function avatarVersion(
  updatedAt: Date | string | number | null | undefined,
): number | null {
  if (updatedAt === null || updatedAt === undefined) return null;
  const ms = new Date(updatedAt).getTime();
  return Number.isFinite(ms) ? ms : null;
}
