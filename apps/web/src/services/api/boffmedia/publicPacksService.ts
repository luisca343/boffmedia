import { apiGET } from "@/services/http/boff-client";

/** The optional-content model, as `@boffmedia/ui`'s OptionalChooser renders it.
 *  Re-exported from there rather than redeclared so the page and the launcher
 *  cannot describe the same pack differently. */
export type { OptionalGroup } from "@boffmedia/ui";

/** What a pack's shareable page shows.
 *
 *  Deliberately NOT the manifest: no `files[]`, no blob hashes, no download
 *  URLs. This is a shop window, and the manifest route — which checks
 *  entitlement — is the one that hands out install sources. */
export type PublicPack = {
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  iconUrl: string | null;
  gallery: { url: string; alt?: string | null }[];
  /** The host only, never the port. */
  serverHost: string | null;
  version: {
    name: string;
    minecraft: string | null;
    loader: string | null;
    loaderVersion: string | null;
    fileCount: number;
    createdAt: string;
  } | null;
  optionalGroups: import("@boffmedia/ui").OptionalGroup[];
};

/**
 * Fetch a pack's public page. Resolves `null` for anything the API will not
 * show a stranger.
 *
 * That is not only "no such pack": a pack whose access is `password` or
 * `allowlist` 404s too, because those exist precisely so a pack's composition is
 * not public. The caller cannot tell the two apart, and should not be able to —
 * distinguishing them would turn this into a "does this private pack exist?"
 * oracle.
 */
export async function getPublicPack(slug: string): Promise<PublicPack | null> {
  const res = await apiGET<PublicPack>(`/packs/launcher/public/${encodeURIComponent(slug)}`, {
    // Shareable and slow-moving: a pack changes when someone publishes a
    // version, not per request. Revalidating hourly keeps a link that gets
    // passed around from hitting the API once per visitor.
    revalidate: 3600,
  });
  return res.success && res.data ? res.data : null;
}
