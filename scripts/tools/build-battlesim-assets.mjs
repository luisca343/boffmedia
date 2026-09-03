#!/usr/bin/env node
/**
 * Builds the battlesim tool asset tree.
 *
 * Unlike build-mewgenics-assets, this one works IN PLACE: `fx/`, `img/` and
 * `audio/` are already the published tree (they are hand-authored effect art,
 * not extractor output), so there is no separate source root to copy from. What
 * this script adds is the part that can be re-derived: the mirrored Pokemon
 * Showdown static sprites, trainer avatars and cries, plus the manifest that
 * `pack-tool-assets.mjs` needs.
 *
 * Usage:
 *   node scripts/tools/build-battlesim-assets.mjs [options]
 *
 * Options:
 *   --out <dir>     tool tree (default: apps/web/public/boffmedia/tools/battlesim)
 *   --skip-mirror   do not touch the network; manifest + report only
 *   --dry-run       report what would happen; write nothing
 *
 * PROVENANCE. The mirrored sprites and cries are Pokemon Showdown's asset set --
 * largely community fan art hosted by PS, not Boffmedia's work. `manifest.json`
 * records where every mirrored category came from so that stays legible once the
 * files are sitting in our own tree. This introduces a `sources` field that
 * build-mewgenics-assets does not have; the rest of the manifest follows its
 * `build: { tool, builtAt, srcHash }` shape so `pack-tool-assets` is happy.
 */

import { createHash } from "node:crypto";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { MIRROR_SETS, PS_ORIGIN, mirrorPsAssets } from "./lib-ps-mirror.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..");
const DEFAULT_OUT = path.join(REPO, "apps/web/public/boffmedia/tools/battlesim");

const USAGE =
  "usage: node scripts/tools/build-battlesim-assets.mjs [--out <dir>] [--skip-mirror] [--dry-run]";

/**
 * Files the pack must never carry.
 *
 * `fx/bg/tulipan.gif` is 158 MB -- 90% of the whole tree -- and is referenced by
 * NOTHING: the only `tulipan` in the codebase is a SmartRotom theme id. It is
 * excluded here rather than deleted because `public/` is gitignored and synced
 * by hand, so deleting it is the owner's call on each box.
 *
 * A path listed here is skipped by the manifest and reported, never removed.
 */
const EXCLUDE = [
  "fx/bg/tulipan.gif",
  // The other backgrounds. `BattleCanvas` hardcodes `hagane` and nothing picks
  // a background at runtime, so these 12.9 MB were shipped to every player and
  // loaded by nobody. They stay on disk — they are real art, and wiring a
  // background picker would put them straight back — but they are not part of
  // the tool as it exists.
  "fx/bg/tsuchi.png",
  "fx/bg/tsuchi2.png",
  "fx/bg/tulipan.png",
  "fx/bg/tulipan_overlay.png",
  "fx/bg/test.png",
  "fx/bg/hagane TR.png",
];

/** pack-tool-assets enforces no ceiling, but the launcher streams per file. */
const MAX_ASSET_BYTES = 16 * 1024 * 1024;

function parseArgs(argv) {
  const out = { out: DEFAULT_OUT, skipMirror: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") out.out = path.resolve(process.cwd(), argv[++i]);
    else if (arg === "--skip-mirror") out.skipMirror = true;
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else {
      console.error(`[build-battlesim-assets] unknown option: ${arg}`);
      console.error(USAGE);
      process.exit(1);
    }
  }
  return out;
}

/** Every file under `root`, as tree-relative POSIX paths. */
async function walk(root, base = root) {
  const out = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else if (entry.isFile()) out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

/** Groups a file list into the categories the size report prints. */
function categorise(rel) {
  if (rel.startsWith("sprites/trainers/")) return "sprites/trainers";
  if (rel.startsWith("sprites/")) return "sprites/pokemon";
  if (rel.startsWith("audio/cries/")) return "audio/cries";
  if (rel.startsWith("fx/bg/")) return "fx/bg";
  if (rel.startsWith("fx/")) return "fx";
  if (rel.startsWith("img/")) return "img";
  if (rel.startsWith("samples/")) return "samples";
  if (rel.startsWith("audio/")) return "audio";
  return "other";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const OUT = args.out;
  const log = (m) => console.log(`[build-battlesim-assets] ${m}`);

  const treeExists = await stat(OUT).then(() => true).catch(() => false);
  if (!treeExists) {
    console.error(`[build-battlesim-assets] tool tree not found: ${OUT}`);
    process.exit(1);
  }

  let mirrorReport = [];
  if (args.skipMirror || args.dryRun) {
    log(args.dryRun ? "dry run -- skipping mirror" : "--skip-mirror -- not touching the network");
  } else {
    log(`mirroring static sprites, avatars and cries from ${PS_ORIGIN}`);
    mirrorReport = await mirrorPsAssets(OUT, { log });
  }

  // -- inventory + size report ------------------------------------------------
  const all = await walk(OUT);
  const excluded = new Set(EXCLUDE);
  const included = all.filter((rel) => !excluded.has(rel) && rel !== "manifest.json");

  const sizes = new Map();
  const oversize = [];
  let totalBytes = 0;
  const byCategory = new Map();
  for (const rel of included) {
    const { size } = await stat(path.join(OUT, rel));
    sizes.set(rel, size);
    totalBytes += size;
    if (size > MAX_ASSET_BYTES) oversize.push({ rel, size });
    const cat = categorise(rel);
    const acc = byCategory.get(cat) ?? { files: 0, bytes: 0 };
    acc.files++;
    acc.bytes += size;
    byCategory.set(cat, acc);
  }

  log("size report (category: files, MB)");
  const ordered = [...byCategory.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  for (const [cat, acc] of ordered) {
    console.log(
      `    ${cat.padEnd(20)} ${String(acc.files).padStart(6)}  ${(acc.bytes / 1e6).toFixed(2).padStart(8)} MB`,
    );
  }
  console.log(
    `    ${"TOTAL".padEnd(20)} ${String(included.length).padStart(6)}  ${(totalBytes / 1e6).toFixed(2).padStart(8)} MB`,
  );

  for (const rel of EXCLUDE) {
    const size = await stat(path.join(OUT, rel)).then((s) => s.size).catch(() => null);
    if (size !== null) {
      log(
        `EXCLUDED ${rel} (${(size / 1e6).toFixed(1)} MB) -- referenced by nothing; delete it by hand if you want the disk back`,
      );
    }
  }
  if (oversize.length) {
    for (const { rel, size } of oversize) {
      console.error(
        `[build-battlesim-assets] OVERSIZE ${rel} is ${(size / 1e6).toFixed(1)} MB (limit ${MAX_ASSET_BYTES / 1e6} MB)`,
      );
    }
    process.exit(1);
  }

  // -- manifest ---------------------------------------------------------------
  // Content-addressed version, same reasoning as build-mewgenics-assets: both
  // hosts cache-key on this string, so it has to move whenever emitted bytes do.
  const hash = createHash("sha256");
  for (const rel of [...included].sort()) hash.update(`${rel}:${sizes.get(rel)}\n`);
  const srcHash = hash.digest("hex").slice(0, 16);
  const stamp = new Date();
  const version = `${stamp.toISOString().replace(/[-:T]/g, "").slice(0, 14)}-${srcHash.slice(0, 8)}`;

  const manifest = {
    tool: "battlesim",
    version,
    counts: Object.fromEntries(ordered.map(([cat, acc]) => [cat, acc.files])),
    sources: [
      {
        what: "Static Pokemon sprites (gen5 front/back, shiny), trainer avatars, cries",
        from: PS_ORIGIN,
        paths: MIRROR_SETS.map((s) => s.local),
        note:
          "Mirrored from Pokemon Showdown, which hosts community fan art for many of these. " +
          "Not Boffmedia's work; mirrored so replays and AI battles render offline. Animated " +
          "sprites are NOT mirrored -- they stream from the CDN when online.",
      },
      {
        what: "Battle effect art, backgrounds and UI bits",
        from: "boffmedia (hand-authored)",
        paths: ["fx", "img", "audio"],
      },
    ],
    excluded: EXCLUDE,
    build: { tool: "battlesim", builtAt: stamp.toISOString(), srcHash },
  };

  if (args.dryRun) {
    log(`dry run -- would write manifest.json version=${version}`);
    return;
  }
  await writeFile(path.join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`, "utf8");
  log(`manifest.json: version=${version} srcHash=${srcHash}`);
  if (mirrorReport.length) {
    const fetched = mirrorReport.reduce((a, r) => a + r.fetched, 0);
    const missing = mirrorReport.reduce((a, r) => a + r.missing.length, 0);
    log(`mirror: ${fetched} fetched, ${missing} missing`);
  }
  log("next: pnpm pack:tool-assets battlesim");
}

main().catch((err) => {
  console.error(`[build-battlesim-assets] ${err.stack || err.message}`);
  process.exit(1);
});
