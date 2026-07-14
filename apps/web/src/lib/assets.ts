import { env } from '@/config/env.public';

/**
 * Build a URL for a static asset served by the API origin (the frozen
 * prefixes: /smartrotom/img, /smartrotom/packs, /uploads, /jcef, /blog…).
 * The single place allowed to join NEXT_PUBLIC_API with an asset path —
 * never hand-build `${env.NEXT_PUBLIC_API}/...` asset strings elsewhere.
 */
export function apiAsset(path: string): string {
  return `${env.NEXT_PUBLIC_API}${path.startsWith('/') ? path : `/${path}`}`;
}
