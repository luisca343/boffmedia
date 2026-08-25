/**
 * packSource.ts — where a datapack's bytes come from.
 *
 * The evaluator core knows nothing about this on purpose: it takes packs that
 * are already in memory. Everything network- or host-shaped lives here.
 *
 * There are three sources, and the split is forced rather than chosen:
 *
 * - `curated` — a bundle we built and serve from our own origin. **Vanilla has
 *   no other option.** Vanilla worldgen JSON is not in the client jar and not
 *   on Modrinth; it comes from misode/mcmeta via codeload.github.com, which
 *   sends no CORS headers, so no browser can fetch it directly. For the popular
 *   mod packs this path is also 30-50x smaller than the source jar.
 * - `modrinth` — fetched straight from Modrinth's CDN, which does send
 *   `access-control-allow-origin: *`. This is the fallback for any pack we have
 *   not curated, and it costs the user a few MB.
 * - `file` — a pack the user dragged in. Never leaves their machine, which is
 *   also why zip-bomb and path-traversal risk never reaches our server.
 */

import { BUNDLE_FILES } from "./bundles.generated";

const MODRINTH_API = "https://api.modrinth.com/v2";

/** A pack the core can consume: bytes plus how to interpret them. */
export interface FetchedPack {
  readonly id: string;
  readonly name: string;
  readonly bytes: Uint8Array;
  readonly format: "bundle" | "zip";
  /** Human-readable provenance, shown in the inspect report. */
  readonly source: string;
  readonly version?: string;
}

export type PackRef =
  | { kind: "curated"; id: string }
  | { kind: "modrinth"; id: string; project: string; loader: string; gameVersion: string }
  | { kind: "file"; id: string; file: File };

/**
 * A curated bundle we ship. The filename is NOT here: it carries a content hash
 * and lives in `bundles.generated.ts`, written by the build script. Keeping it
 * out of this hand-edited list is the point — a filename typed by a human
 * cannot be trusted to change when the bytes do, and `/boffmedia/tools/*` is
 * served immutable for a year.
 */
export interface CuratedPack {
  readonly id: string;
  readonly label: string;
  readonly version: string;
  readonly source: string;
  /** Bundles must stack in this order — vanilla first, then mods in load order. */
  readonly order: number;
  /**
   * Packs this one cannot be stacked with, because they overwrite each other's
   * worldgen rather than combining.
   *
   * We overlay packs last-wins, one file at a time. The game does not: mods
   * like Lithostitched *merge* two packs' edits to the same file. Where two
   * packs rewrite the same noise router, last-wins produces a world that is
   * neither of them and matches no real Minecraft — so the picker keeps them
   * apart rather than letting the map lie.
   */
  readonly conflicts?: readonly string[];
}

/**
 * The curated catalog. These are the exact builds the CLI validated against,
 * pinned by version: validating against one build and searching with another
 * means nothing, so the version is part of the filename, not a "latest" alias.
 */
export const CURATED_PACKS: readonly CuratedPack[] = [
  {
    id: "vanilla",
    label: "Minecraft 1.21.1",
    version: "1.21.1",
    source: "misode/mcmeta 1.21.1-data",
    order: 0,
  },
  {
    id: "terralith",
    label: "Terralith",
    version: "2.6.2",
    source: "modrinth:terralith",
    order: 10,
    conflicts: ["tectonic"],
  },
  {
    id: "continents",
    label: "Continents",
    version: "1.1.14",
    source: "modrinth:continents",
    order: 20,
  },
  /*
   * Terrain, not biomes: Tectonic rewrites vanilla's whole noise router —
   * continents, erosion, depth, ridges, final_density — and adds no biomes of
   * its own. Measured against vanilla on one seed over 289 points, it moves
   * 199 of them and lifts peak surface height from 168 to 208.
   *
   * **It cannot be stacked with Terralith here.** The two collide on 19 files,
   * including `temperature` and `vegetation` — the router outputs that choose
   * a biome. In game, Lithostitched merges those edits; we overlay last-wins,
   * and the result is a world neither pack describes: with both enabled,
   * `lush_caves` turns up at the SURFACE in 19 of 289 samples one way round
   * and `mushroom_fields` in 15 the other. Tectonic's own `overlay.terratonic`
   * compatibility layer does not rescue it (19 of 289, unchanged) because the
   * problem is the merge model, not the content. Hence `conflicts`.
   *
   * Version 3.0.2 rather than the newest 3.0.25 on purpose: 3.0.25's base
   * `noise_settings/overworld.json` reads `preliminary_surface_level`, a noise
   * router field Minecraft added in 1.21.9, and ships the density function
   * backing it only in `overlay.1_21_9` (pack_format 82+). At 1.21.1's format
   * 48 that overlay correctly does not apply, so the reference dangles — the
   * game ignores the unknown field, deepslate resolves it and throws.
   */
  {
    id: "tectonic",
    label: "Tectonic",
    version: "3.0.2",
    source: "modrinth:tectonic (datapack, +overlay.datapack)",
    order: 30,
    conflicts: ["terralith"],
  },
];

/**
 * Drop packs that cannot stack with one already in the list, keeping the first
 * of any conflicting pair.
 *
 * The picker will not build such a pair, but a shared URL is not the picker:
 * `?packs=terralith,tectonic` would otherwise load both and render a world
 * that is neither of them, with nothing on screen to say so.
 */
export function resolvePackConflicts(ids: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const conflicts = CURATED_PACKS.find((p) => p.id === id)?.conflicts ?? [];
    if (out.some((k) => conflicts.includes(k))) continue;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function curatedPack(id: string): CuratedPack {
  const p = CURATED_PACKS.find((c) => c.id === id);
  if (!p) throw new Error(`No curated pack "${id}". Known: ${CURATED_PACKS.map((c) => c.id).join(", ")}`);
  return p;
}

/**
 * Where the curated bundles are served from. The worker has no `@/` and no
 * Next.js, so the host passes this in once (see `configureSeedPacks`) rather
 * than the module reaching for an import alias it is not allowed to have.
 */
let bundleBaseUrl = "";

export function configureSeedPacks(opts: { bundleBaseUrl: string }): void {
  const base = opts.bundleBaseUrl.replace(/\/$/, "");
  // A worker has no document base URL, so `fetch("/boffmedia/...")` throws
  // "Failed to parse URL" rather than resolving against the page. Hosts pass a
  // root-relative prefix (that is what `@boffmedia/asset-paths` is), so absolutise
  // it here against the worker's own origin. An already-absolute base — which is
  // what a desktop host would hand us — is left alone.
  bundleBaseUrl = /^[a-z]+:\/\//i.test(base) ? base : new URL(base, self.location.origin).toString();
}

async function fetchBytes(url: string, what: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch ${what}: HTTP ${res.status} from ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * Newest Modrinth version matching project + game version + loader.
 *
 * Deliberately not "latest overall": a Terralith build for 1.21.4 evaluates to
 * a different world than the 1.21.1 one, and silently mixing them is the exact
 * failure mode that makes a search return confident nonsense.
 */
export async function resolveModrinth(
  project: string,
  gameVersion: string,
  loader: string,
): Promise<{ version: string; filename: string; url: string; sha1?: string }> {
  const url =
    `${MODRINTH_API}/project/${encodeURIComponent(project)}/version` +
    `?game_versions=${encodeURIComponent(JSON.stringify([gameVersion]))}` +
    `&loaders=${encodeURIComponent(JSON.stringify([loader]))}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Modrinth lookup failed for ${project}: HTTP ${res.status}`);
  const versions = (await res.json()) as Array<{
    version_number: string;
    files: Array<{ primary: boolean; filename: string; url: string; hashes?: { sha1?: string } }>;
  }>;

  if (!versions.length) {
    throw new Error(`No ${project} build for Minecraft ${gameVersion} / ${loader}.`);
  }
  const v = versions[0]!;
  const file = v.files.find((f) => f.primary) ?? v.files[0]!;
  return { version: v.version_number, filename: file.filename, url: file.url, sha1: file.hashes?.sha1 };
}

/** Resolve one reference to bytes. Runs wherever it is called — main thread or worker. */
export async function fetchPack(ref: PackRef): Promise<FetchedPack> {
  if (ref.kind === "curated") {
    const p = curatedPack(ref.id);
    if (!bundleBaseUrl) {
      throw new Error("configureSeedPacks({ bundleBaseUrl }) was never called — no idea where the bundles live.");
    }
    const file = BUNDLE_FILES[p.id];
    if (!file) {
      throw new Error(
        `No bundle built for "${p.id}". Run scripts/build-seed-bundle.mjs — the manifest is generated, not hand-written.`,
      );
    }
    return {
      id: p.id,
      name: p.id,
      bytes: await fetchBytes(`${bundleBaseUrl}/${file}`, `${p.label} ${p.version}`),
      format: "bundle",
      source: p.source,
      version: p.version,
    };
  }

  if (ref.kind === "modrinth") {
    const info = await resolveModrinth(ref.project, ref.gameVersion, ref.loader);
    return {
      id: ref.id,
      name: ref.id,
      bytes: await fetchBytes(info.url, `${ref.project} ${info.version}`),
      format: "zip",
      source: `modrinth:${ref.project}`,
      version: info.version,
    };
  }

  return {
    id: ref.id,
    name: ref.id,
    bytes: new Uint8Array(await ref.file.arrayBuffer()),
    format: "zip",
    source: `upload:${ref.file.name}`,
  };
}

/**
 * Resolve a whole stack in parallel, preserving declaration order. Order is the
 * override order Minecraft itself uses — later packs win — so it is load-bearing
 * and must survive the concurrency.
 */
export async function fetchPacks(refs: readonly PackRef[]): Promise<FetchedPack[]> {
  return Promise.all(refs.map(fetchPack));
}
