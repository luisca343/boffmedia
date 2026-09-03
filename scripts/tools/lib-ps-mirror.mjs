// Mirrors static assets from play.pokemonshowdown.com into the battlesim tool tree.
//
// Strategy: PS serves an Apache-style directory index for every asset folder, so we
// enumerate the remote listing rather than deriving ids from @pkmn/dex. That matters
// for two reasons: the dex has no mapping for a number of cosmetic formes that DO
// have sprites, and a dex-driven run spends thousands of requests on 404s. The local
// tree mirrors the CDN path exactly (`sprites/gen5/<id>.png`), which is what lets
// `spriteUrl()` switch source by swapping the origin and nothing else.
//
// Existence on disk is the cache: re-runs only fetch ids that appeared upstream since.

import { mkdir, readdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const PS_ORIGIN = "https://play.pokemonshowdown.com";

/** Remote dir -> local dir, relative to the tool asset root. */
export const MIRROR_SETS = [
  { remote: "sprites/gen5", local: "sprites/gen5", ext: ".png" },
  { remote: "sprites/gen5-shiny", local: "sprites/gen5-shiny", ext: ".png" },
  { remote: "sprites/gen5-back", local: "sprites/gen5-back", ext: ".png" },
  { remote: "sprites/gen5-back-shiny", local: "sprites/gen5-back-shiny", ext: ".png" },
  { remote: "sprites/trainers", local: "sprites/trainers", ext: ".png" },
  { remote: "audio/cries", local: "audio/cries", ext: ".mp3" },
];

/** Battle music tracks from Pokémon Showdown. Hardcoded list to avoid duplicating cries. */
export const MUSIC_TRACKS = [
  'bw-rival',
  'bw-subway-trainer',
  'bw-trainer',
  'bw2-homika-dogars',
  'bw2-kanto-gym-leader',
  'bw2-rival',
  'colosseum-miror-b',
  'dpp-rival',
  'dpp-trainer',
  'hgss-johto-trainer',
  'hgss-kanto-trainer',
  'oras-rival',
  'oras-trainer',
  'sm-rival',
  'sm-trainer',
  'spl-elite4',
  'xd-miror-b',
  'xy-rival',
  'xy-trainer',
];

const CONCURRENCY = 12;
const RETRIES = 3;

async function fetchWithRetry(url, init) {
  let lastErr;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
      if (res.ok) return res;
      // 404 is a real answer, not a transient failure — do not burn retries on it.
      if (res.status === 404) return res;
      lastErr = new Error(`HTTP ${res.status} for ${url}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
  }
  throw lastErr;
}

/**
 * Parses an Apache-style index page into the list of BARE filenames with `ext`.
 *
 * The listings are not consistent about how they spell an entry: `sprites/gen5`
 * emits `href="./0.png"` while `sprites/trainers` emits `href="aaron.png"`. A
 * capture that keeps the `./` survives every check here and then dies at fetch
 * time, because encodeURIComponent turns the slash into `%2F` and the CDN
 * answers 404 for every file. So normalise to a basename and drop anything that
 * still looks like a path.
 */
export async function listRemote(remoteDir, ext) {
  const res = await fetchWithRetry(`${PS_ORIGIN}/${remoteDir}/`);
  if (!res.ok) throw new Error(`cannot list ${remoteDir}: HTTP ${res.status}`);
  const html = await res.text();
  const names = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    let name = decodeURIComponent(m[1]).trim();
    if (name.startsWith("./")) name = name.slice(2);
    // Parent links, query-sorted column headers and any nested path.
    if (!name || name.includes("/") || name.startsWith("?") || name.startsWith("#")) continue;
    if (name.toLowerCase().endsWith(ext)) names.add(name);
  }
  return [...names].sort();
}

async function localNames(dir) {
  try {
    return new Set(await readdir(dir));
  } catch {
    return new Set();
  }
}

/** Runs `worker` over `items` with a fixed concurrency. */
async function pool(items, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

/**
 * Mirrors every configured set into `root`.
 * @returns per-set stats: {remote, total, fetched, skipped, missing, bytes}
 */
export async function mirrorPsAssets(root, { log = () => {} } = {}) {
  const report = [];
  for (const set of MIRROR_SETS) {
    const dir = join(root, set.local);
    await mkdir(dir, { recursive: true });

    const remote = await listRemote(set.remote, set.ext);
    const present = await localNames(dir);
    const todo = remote.filter((n) => !present.has(n));

    log(`${set.remote}: ${remote.length} upstream, ${remote.length - todo.length} cached, ${todo.length} to fetch`);

    let fetched = 0;
    let bytes = 0;
    const missing = [];
    await pool(todo, async (name) => {
      const res = await fetchWithRetry(`${PS_ORIGIN}/${set.remote}/${encodeURIComponent(name)}`);
      if (!res.ok) {
        missing.push(name);
        return;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(join(dir, name), buf);
      fetched++;
      bytes += buf.length;
    });

    // Cached files still count toward the published tree, so size the whole dir.
    let totalBytes = 0;
    for (const name of await localNames(dir)) {
      totalBytes += (await stat(join(dir, name))).size;
    }

    report.push({
      remote: set.remote,
      local: set.local,
      total: remote.length,
      fetched,
      skipped: remote.length - todo.length,
      missing,
      bytes: totalBytes,
      fetchedBytes: bytes,
    });
    log(`${set.remote}: done — ${fetched} fetched, ${missing.length} missing, ${(totalBytes / 1e6).toFixed(1)} MB on disk`);
  }

  // Mirror battle music tracks separately (hardcoded list to avoid duplication with cries)
  const musicDir = join(root, 'audio/music');
  await mkdir(musicDir, { recursive: true });
  const musicPresent = await localNames(musicDir);
  const musicTodo = MUSIC_TRACKS.filter((name) => !musicPresent.has(`${name}.mp3`));

  log(`audio/music: ${MUSIC_TRACKS.length} expected, ${MUSIC_TRACKS.length - musicTodo.length} cached, ${musicTodo.length} to fetch`);

  let musicFetched = 0;
  let musicBytes = 0;
  const musicMissing = [];
  await pool(musicTodo, async (trackName) => {
    const fileName = `${trackName}.mp3`;
    const res = await fetchWithRetry(`${PS_ORIGIN}/audio/${encodeURIComponent(fileName)}`);
    if (!res.ok) {
      musicMissing.push(fileName);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(join(musicDir, fileName), buf);
    musicFetched++;
    musicBytes += buf.length;
  });

  // Size the whole music directory
  let totalMusicBytes = 0;
  for (const name of await localNames(musicDir)) {
    totalMusicBytes += (await stat(join(musicDir, name))).size;
  }

  report.push({
    remote: 'audio (music)',
    local: 'audio/music',
    total: MUSIC_TRACKS.length,
    fetched: musicFetched,
    skipped: MUSIC_TRACKS.length - musicTodo.length,
    missing: musicMissing,
    bytes: totalMusicBytes,
    fetchedBytes: musicBytes,
  });
  log(`audio/music: done — ${musicFetched} fetched, ${musicMissing.length} missing, ${(totalMusicBytes / 1e6).toFixed(1)} MB on disk`);

  return report;
}
