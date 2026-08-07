import type { PackManifest } from "@boffmedia/pack-schema"

import {
  instanceScan,
  isDesktop,
  localPacksList,
  packsList,
  playsGet,
  playtimeGet,
  type LauncherPack,
} from "../runtime"
import { mockPackEntries } from "./mock"
import type { InstallState, PackEntry, PackVersionSummary } from "./types"

// The bridge between the registry's wire shape (§7.2) and what this machine
// knows about each pack. The server decides WHICH packs exist for this player;
// the InstallState is ours, and comes from scanning the instance directory.

/** What a load produced. `registryError` is set when the MANAGED half failed
 *  but the local half did not — a partial library, which is a very different
 *  thing from an empty one and must not be reported as either an error or a
 *  complete list. */
export type PackLibrary = {
  entries: PackEntry[]
  registryError: string | null
}

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

/** A local pack has no separate "listing" shape — it IS the manifest — so this
 *  derives the same view model a managed pack's `LauncherPack` gives, straight
 *  from the document `local_packs_list` returns. */
function toLocalEntry(manifest: PackManifest): PackEntry {
  const loaderEntry = Object.entries(manifest.version.dependencies ?? {}).find(
    ([key]) => key !== "minecraft",
  )
  return {
    pack: {
      id: manifest.pack.id,
      slug: manifest.pack.slug,
      name: manifest.pack.name,
      summary: manifest.pack.summary ?? null,
      description: manifest.pack.description ?? null,
      iconUrl: manifest.pack.iconUrl ?? null,
      // A local pack's gallery lives on disk (convention dir), not in the
      // manifest, so the listing carries none — GalleryTab reads it by slug.
      gallery: [],
      accessKind: manifest.pack.access.kind,
      gameType: "minecraft",
    },
    latest: {
      id: manifest.version.id,
      name: manifest.version.name,
      minecraft: (manifest.version.dependencies ?? {}).minecraft ?? null,
      loader: loaderEntry?.[0] ?? null,
      loaderVersion: loaderEntry?.[1] ?? null,
      fileCount: manifest.version.files.length,
      createdAt: manifest.version.createdAt,
    },
    // A local pack is always "on disk" as a document; install/launch runs the
    // same verify-then-install pass a managed pack does, so its files are
    // "installed" only once that has actually happened. Scanned below like
    // any other slug.
    state: { kind: "not-installed" },
    lastPlayed: null,
    origin: "local",
    server: manifest.pack.server,
  }
}

/**
 * Load the player's library. In a browser there is no Rust side, so the mock
 * list stands in — that is what keeps `pnpm dev:renderer` a complete UI
 * environment. Throws an AuthFailure on desktop; the caller decides whether
 * that means "sign in again" or "the server is down".
 *
 * Managed and local packs are merged by slug; a local pack can never win that
 * merge over a managed one, because every local slug carries the reserved
 * `local-` prefix a managed slug never has (RF-10, spec D3) — so there is
 * nothing here for a collision to resolve.
 */
export async function loadPackEntries(): Promise<PackLibrary> {
  if (!isDesktop()) return { entries: mockPackEntries(), registryError: null }

  // The registry is the ONLY part of this that needs a network, and it used to
  // be able to sink the whole load: one `Promise.all` meant an unreachable
  // server also threw away the local packs and the play history, which live
  // entirely on this disk. A player on a train got an error screen instead of
  // the packs sitting in front of them.
  const [managedResult, plays, playtime, localManifests] = await Promise.all([
    packsList().then(
      (packs) => ({ packs, error: null as string | null }),
      (err: { message?: string }) => ({
        packs: [] as LauncherPack[],
        error: err?.message ?? "No se pudo contactar con el servidor de packs.",
      }),
    ),
    playsGet().catch(() => ({}) as Record<string, string>),
    playtimeGet().catch(() => ({}) as Record<string, number>),
    localPacksList().catch(() => []),
  ])
  const packs = managedResult.packs

  const managed = await Promise.all(
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
      const entry: PackEntry = {
        pack: {
          id: pack.id,
          slug: pack.slug,
          name: pack.name,
          summary: pack.summary,
          description: pack.description ?? null,
          iconUrl: pack.iconUrl,
          gallery: (pack.gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? null })),
          accessKind: pack.accessKind,
          gameType: pack.gameType ?? "minecraft",
        },
        latest,
        state,
        lastPlayed: plays[pack.id] ?? null,
        playMs: playtime[pack.id] ?? 0,
        origin: "managed",
        // A managed pack is a server pack when the registry declares a Quick
        // Play target for it — the same signal a local pack carries in its
        // manifest, so the card treats both identically.
        server: pack.server ?? undefined,
      }
      return entry
    }),
  )

  const local = await Promise.all(
    localManifests.map(async (manifest) => {
      const entry = toLocalEntry(manifest)
      entry.lastPlayed = plays[manifest.pack.id] ?? null
      entry.playMs = playtime[manifest.pack.id] ?? 0
      try {
        entry.state = await instanceScan(entry.pack.slug, null)
      } catch {
        /* keep the listing usable */
      }
      return entry
    }),
  )

  const managedSlugs = new Set(managed.map((e) => e.pack.slug))
  return {
    entries: [...managed, ...local.filter((e) => !managedSlugs.has(e.pack.slug))],
    registryError: managedResult.error,
  }
}
