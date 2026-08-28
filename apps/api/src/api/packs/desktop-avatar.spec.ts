import { absoluteAssetUrl } from '@/config/asset-url';
import { DEFAULT_PROFILE_PICTURE } from '@api/boffmedia/users/users.constants';
import { desktopAvatarUrl } from './desktop-avatar';

describe('desktopAvatarUrl', () => {
  // Built the same way the helper does, so this suite asserts the AVATAR rules
  // (default, oauth, versioning) and leaves which-base-for-which-tree to
  // `config/asset-url.spec.ts`, which owns it.
  const url = (path: string) => absoluteAssetUrl(path);
  const AT = new Date('2026-08-28T10:00:00.000Z');
  const V = AT.getTime();

  it('absolutises a stored relative path onto the asset origin', () => {
    // The whole reason this exists: on `tauri://localhost` the raw column value
    // resolves against the custom protocol and fetches nothing.
    expect(desktopAvatarUrl('/uploads/profiles/42.png', AT)).toBe(
      `${url('/uploads/profiles/42.png')}?v=${V}`,
    );
  });

  it('joins exactly one slash whether or not the path has a leading one', () => {
    expect(desktopAvatarUrl('uploads/profiles/42.png', AT)).toBe(
      `${url('/uploads/profiles/42.png')}?v=${V}`,
    );
    expect(desktopAvatarUrl('///uploads/profiles/42.png', AT)).toBe(
      `${url('/uploads/profiles/42.png')}?v=${V}`,
    );
  });

  it('changes the url when the account row changes', () => {
    // Uploaded avatars are overwritten IN PLACE at a url keyed by user id, and
    // the launcher's icon cache is content-addressed by url and never expires.
    // Without this the player would keep seeing their old face forever.
    const before = desktopAvatarUrl('/uploads/profiles/42.png', AT);
    const after = desktopAvatarUrl(
      '/uploads/profiles/42.png',
      new Date(AT.getTime() + 1000),
    );
    expect(after).not.toBe(before);
  });

  it('accepts the date as a string or a number, as a driver may hand it over', () => {
    expect(desktopAvatarUrl('/uploads/profiles/42.png', AT.toISOString())).toBe(
      `${url('/uploads/profiles/42.png')}?v=${V}`,
    );
    expect(desktopAvatarUrl('/uploads/profiles/42.png', V)).toBe(
      `${url('/uploads/profiles/42.png')}?v=${V}`,
    );
  });

  it('omits the token rather than stamping NaN when the date is unusable', () => {
    // `?v=NaN` would be a fresh cache key on every call, which defeats the
    // cache entirely instead of merely failing to bust it.
    expect(desktopAvatarUrl('/uploads/profiles/42.png', 'not a date')).toBe(
      `${url('/uploads/profiles/42.png')}`,
    );
    expect(desktopAvatarUrl('/uploads/profiles/42.png')).toBe(
      `${url('/uploads/profiles/42.png')}`,
    );
  });

  it('passes an OAuth CDN url through untouched', () => {
    // Discord/Twitch/Google hand us their own absolute url on sign-up.
    // Prefixing an origin onto one 404s every social account, and appending a
    // token can invalidate a signed url — theirs already changes with the
    // picture.
    const cdn = 'https://cdn.discordapp.com/avatars/1/a.png';
    expect(desktopAvatarUrl(cdn, AT)).toBe(cdn);
    expect(desktopAvatarUrl('http://example.test/a.png', AT)).toBe(
      'http://example.test/a.png',
    );
  });

  it('reports the shipped default as no avatar at all', () => {
    // Null is what makes the launcher draw its monogram. Returning a url here
    // would render every account as the same silhouette, which is exactly what
    // a switcher must not do.
    expect(desktopAvatarUrl(DEFAULT_PROFILE_PICTURE, AT)).toBeNull();
  });

  it('treats empty, blank and missing as no avatar', () => {
    expect(desktopAvatarUrl(null, AT)).toBeNull();
    expect(desktopAvatarUrl(undefined, AT)).toBeNull();
    expect(desktopAvatarUrl('', AT)).toBeNull();
    expect(desktopAvatarUrl('   ', AT)).toBeNull();
  });
});

describe('the url handed to the launcher', () => {
  it('is absolute, since a relative one cannot be fetched off our origin', () => {
    // A bare path here is the bug this whole file exists to prevent.
    expect(
      desktopAvatarUrl('/uploads/profiles/42.png', new Date()),
    ).toMatch(/^https?:\/\//);
  });
});
