import { isDesktop, packsList, type LauncherPack } from "../runtime"
import { mockPackEntries } from "./mock"
import type { PackEntry, PackVersionSummary } from "./types"

// The bridge between the registry's wire shape (§7.2) and what this machine
// knows about each pack. The server decides WHICH packs exist for this player;
// only the InstallState is ours to compute, and until §6 lands there is nothing
// on disk to reconcile against — so every pack reads as not-installed rather
// than pretending otherwise.

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

  const packs = await packsList()
  return packs.map((pack) => ({
    pack: {
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      summary: pack.summary,
      iconUrl: pack.iconUrl,
      accessKind: pack.accessKind,
    },
    latest: toVersion(pack),
    // TODO(§6): read the instance directory and report installed/outdated by
    // comparing the version on disk against `latest`.
    state: { kind: "not-installed" },
    lastPlayed: null,
  }))
}
