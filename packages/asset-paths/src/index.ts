/**
 * The frozen URL prefixes of the shared asset tree, shared by every host (web,
 * api, desktop). Host-agnostic on purpose: no framework imports, no runtime
 * dependencies, plain strings.
 *
 * Each value is a root-relative prefix with a leading and no trailing slash, so
 * a caller joins segments onto it without guessing about separators. Two trees
 * sit behind these prefixes and the split is what keeps `public/` disposable:
 *
 * - `public/` is read-only at runtime — content-addressed or hand-placed bytes
 *   (`smartrotom`, `boffmedia`, `jcef`, `blog`).
 * - `laboon/` holds everything written while the app runs (`uploads`), which is
 *   why `uploads` is the only prefix here whose bytes can change under a stable
 *   name.
 *
 * The prefixes are a public contract: URLs built from them are stored in the
 * database and handed to external clients, so a value may not change without
 * migrating the stored rows that already contain it.
 */
export const ASSET = {
  smartrotom: {
    img: '/smartrotom/img',
    packs: '/smartrotom/packs',
    data: '/smartrotom/data',
    audio: '/smartrotom/audio',
    armourers: '/smartrotom/armourers',
    combates: '/smartrotom/combates',
  },
  boffmedia: {
    fonts: '/boffmedia/fonts',
    brand: '/boffmedia/brand',
    img: '/boffmedia/img',
    tools: {
      battlesim: '/boffmedia/tools/battlesim',
      tcg: '/boffmedia/tools/tcg',
      mewgenics: '/boffmedia/tools/mewgenics',
      mhwilds: '/boffmedia/tools/mhwilds',
      seeds: '/boffmedia/tools/seeds',
      packs: '/boffmedia/tools/packs',
    },
  },
  uploads: {
    sharex: '/uploads/sharex',
    profiles: '/uploads/profiles',
    chat: '/uploads/chat',
    mhwilds: '/uploads/mhwilds',
    starbank: '/uploads/starbank',
  },
  jcef: '/jcef',
  blog: '/blog',
} as const;

/** Any prefix string reachable from {@link ASSET}. */
export type AssetPrefix =
  | (typeof ASSET)['smartrotom'][keyof (typeof ASSET)['smartrotom']]
  | (typeof ASSET)['boffmedia']['fonts']
  | (typeof ASSET)['boffmedia']['brand']
  | (typeof ASSET)['boffmedia']['img']
  | (typeof ASSET)['boffmedia']['tools'][keyof (typeof ASSET)['boffmedia']['tools']]
  | (typeof ASSET)['uploads'][keyof (typeof ASSET)['uploads']]
  | (typeof ASSET)['jcef']
  | (typeof ASSET)['blog'];

/**
 * Join a prefix and segments into a root-relative URL path, tolerating stray
 * slashes on either side of every part and dropping empty segments.
 */
export function joinAssetPath(prefix: string, ...segments: string[]): string {
  const parts = [prefix, ...segments]
    .map((part) => String(part).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return `/${parts.join('/')}`;
}
