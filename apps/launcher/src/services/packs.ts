import { instanceScan, isDesktop, packsList, playsGet, type LauncherPack } from "../runtime"
import { mockPackEntries } from "./mock"
import type { InstallState, PackEntry, PackVersionSummary } from "./types"

// The bridge between the registry's wire shape (§7.2) and what this machine
// knows about each pack. The server decides WHICH packs exist for this player;
// the InstallState is ours, and comes from scanning the instance directory.

function toVersion(pack: LauncherPack): PackVersionSummary | null {
  const v = pack.latestVersion
  if (!v) return null
  return {
    id: v.id,
    name: v.name,
    minecraft: v.minecraft,
    loader: v.loader,
    loaderVersion: v.loaderVersion,
    fileCount: v.fileCount,
    createdAt: v.createdAt,
  }
}

/**
 * Load the player's library. In a browser there is no Rust side, so the mock
 * list stands in — that is what keeps `pnpm dev:renderer` a complete UI
 * environment. Throws an AuthFailure on desktop; the caller decides whether
 * that means "sign in again" or "the server is down".
 */
export async function loadPackEntries(): Promise<PackEntry[]> {
  if (!isDesktop()) return mockPackEntries()

  const [packs, plays] = await Promise.all([packsList(), playsGet()])
  return Promise.all(
    packs.map(async (pack) => {
      const latest = toVersion(pack)
      // A scan is a few stat() calls; one unreadable instance must not take the
      // whole library down with it, so it degrades to "not installed".
      let state: InstallState = { kind: "not-installed" }
      try {
        state = await instanceScan(pack.slug, latest?.id ?? null)
      } catch {
        /* keep the listing usable */
      }
      return {
        pack: {
          id: pack.id,
          slug: pack.slug,
          name: pack.name,
          summary: pack.summary,
          iconUrl: pack.iconUrl,
          accessKind: pack.accessKind,
        },
        latest,
        state,
        lastPlayed: plays[pack.id] ?? null,
      }
    }),
  )
}
