/**
 * One asset resolver for the whole tool.
 *
 * Every url this package builds — sprites, icons, palettes, cursors, the JSON
 * dataset itself — is a root-relative path under the shared asset tree, handed
 * to the host so it can say where those bytes actually live: the site's own
 * origin on the web, the `boffasset://` cache in the launcher.
 *
 * The `hasToolHost()` guard is about SERVER RENDERING, not about safety. On
 * apps/web the capabilities are browser defaults and are registered only in the
 * browser, so `assetUrl` throws during a prerender — which it did, and it took
 * the whole `next build` down on the builder page. The fallback returns the
 * root-relative path, which is EXACTLY what the web host's `assetUrl` returns
 * anyway (it is the identity there), so the server's markup and the client's
 * first render agree and nothing has to be re-resolved after hydration. The
 * launcher, which is the host that does rewrite these, never server-renders.
 */

import { assetUrl, hasToolHost } from "@boffmedia/tool-kit";
import { ASSET, joinAssetPath } from "@boffmedia/asset-paths";

export function mewAssetUrl(path: string): string {
  const rooted = joinAssetPath(ASSET.boffmedia.tools.mewgenics, path);
  return hasToolHost() ? assetUrl(rooted) : rooted;
}
