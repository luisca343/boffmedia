#!/usr/bin/env node
/**
 * Run the complete MH Wilds bestiary refresh and report what is new.
 *
 * This is the canonical update command. It snapshots the previous normalized
 * catalog before a clean extraction, runs extraction -> decode/normalize ->
 * runtime build, and compares the two catalogs by game IDs. The comparison is
 * intentionally ID-based so localized names and renamed variants do not make
 * an existing monster look new.
 *
 * Usage:
 *   pnpm update:mhwilds-bestiary
 *   pnpm update:mhwilds-bestiary -- --game "D:\\Games\\Monster Hunter Wilds"
 *   pnpm update:mhwilds-bestiary -- --path "natives/stm/.../new_icon.tex.X"
 *
 * `--game`, `--file-list`, `--extractor`, `--image-converter`, `--path`,
 * `--include`, `--exclude`, `--download-list` and `--keep-work` are forwarded
 * to the extractor. The refresh uses `--convert` and `--clean` by default;
 * pass `--no-convert` or `--no-clean` when inspecting a partial workspace.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const ASSETS = path.join(REPO, "laboon/tool-sources/mhwilds/extracted/bestiary");
const NORMALIZED = path.join(ASSETS, "bestiary-data.json");
const EXTRACT = path.join(HERE, "extract-mhwilds-assets.mjs");
const DECODE = path.join(HERE, "decode-mhwilds-bestiary.mjs");
const BUILD = path.join(HERE, "build-mhwilds-assets.mjs");

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/update-mhwilds-bestiary.mjs [options]

Run the full extraction, decode, normalization and runtime asset build.

Options:
  --game <dir>             Forward a different Steam installation directory
  --path <archive-path>    Forward an exact PAK path (repeatable)
  --include <regex>        Forward an archive include pattern
  --exclude <regex>        Forward an archive exclude pattern
  --file-list <file>       Forward a different RE Engine path list
  --extractor <file>       Forward a different RETool executable
  --image-converter <exe>  Forward a different texconv executable
  --decoder <dir>          Use a different decoder checkout
  --discover-id <id>       Forward a focused visual discovery id, repeatable
  --no-discover             Do not scan patch PAK indexes for new visual paths
  --no-convert             Do not convert TEX files to PNG
  --no-clean               Keep files that are no longer selected
  --keep-work              Keep temporary per-PAK extraction directories
  --download-list          Download the file list when missing
  --help                   Show this help`);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function run(label, script, args) {
  console.log(`[mhwilds-update] ${label}`);
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: REPO,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${label} failed with exit code ${result.status}`);
}

function hasFlag(args, flag) {
  return args.some((arg) => arg === flag);
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function valuesAfter(args, flag) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && args[index + 1]) values.push(args[index + 1]);
  }
  return values;
}

function extractArgs(argv, options = {}) {
  const discover = options.discover ?? true;
  const clean = options.clean ?? !hasFlag(argv, "--no-clean");
  const args = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (
      arg === "--no-convert" ||
      arg === "--no-clean" ||
      arg === "--no-discover" ||
      arg === "--discover-id"
    ) {
      if (arg === "--discover-id") index += 1;
      continue;
    }
    // `--decoder` belongs to the decode/normalize stage, not the extractor.
    if (arg === "--decoder") {
      index += 1;
      continue;
    }
    if (arg === "--clean") continue;
    args.push(arg);
  }
  if (!hasFlag(argv, "--no-convert") && !hasFlag(args, "--convert")) args.push("--convert");
  if (clean) args.push("--clean");
  if (!discover) args.push("--no-discover");
  for (const id of options.discoveryIds ?? []) args.push("--discover-id", id);
  for (const archivePath of options.paths ?? []) args.push("--path", archivePath);
  return args;
}

function decodeArgs(argv) {
  const args = [];
  const decoder = valueAfter(argv, "--decoder");
  if (decoder) args.push("--decoder", decoder);
  return args;
}

function assetLinks(data) {
  const links = new Set();
  for (const monster of data?.monsters ?? []) {
    for (const variant of monster.variants ?? []) {
      for (const [kind, asset] of Object.entries(variant.assets ?? {})) {
        if (typeof asset === "string") links.add(`${monster.id}/${variant.id}/${kind}:${asset}`);
        else if (asset?.png) links.add(`${monster.id}/${variant.id}/${kind}:${asset.png}`);
      }
    }
  }
  return links;
}

function catalog(data) {
  const monsters = new Map();
  const variants = new Map();
  for (const monster of data?.monsters ?? []) {
    monsters.set(monster.id, monster);
    for (const variant of monster.variants ?? [])
      variants.set(`${monster.id}/${variant.id}`, variant);
  }
  return { monsters, variants, assets: assetLinks(data) };
}

function logNewAdditions(previous, current) {
  const before = catalog(previous);
  const after = catalog(current);
  const newMonsters = [...after.monsters.keys()].filter((id) => !before.monsters.has(id));
  const newVariants = [...after.variants.keys()].filter((id) => !before.variants.has(id));
  const newAssets = [...after.assets].filter((asset) => !before.assets.has(asset));

  console.log(`[mhwilds-update] NEW additions: monsters=${newMonsters.length}, variants=${newVariants.length}, asset-links=${newAssets.length}`);
  if (newMonsters.length) {
    console.log(`[mhwilds-update] NEW monsters: ${newMonsters.map((id) => `${id} (${after.monsters.get(id)?.variants?.[0]?.identity?.names?.en ?? id})`).join(", ")}`);
  }
  if (newVariants.length) console.log(`[mhwilds-update] NEW variants: ${newVariants.join(", ")}`);
  if (newAssets.length) console.log(`[mhwilds-update] NEW asset links: ${newAssets.join(", ")}`);
  if (!previous) console.log("[mhwilds-update] No previous catalog existed; the complete current catalog is the initial addition.");
}

function auditVisualRoster(data) {
  const reportVariants = [];
  for (const monster of data?.monsters ?? []) {
    for (const variant of monster.variants ?? []) {
      if (!variant.report?.anatomyLayout) continue;
      reportVariants.push({ monster, variant });
    }
  }

  const missing = [];
  for (const { monster, variant } of reportVariants) {
    const label =
      variant.identity?.names?.en ?? variant.identity?.names?.es ?? monster.id;
    const icon = variant.assets?.icon?.png;
    const anatomy = variant.assets?.anatomy?.png;
    const fixedId = variant.identity?.fixedId;
    const missingFields = [];
    if (fixedId == null) missingFields.push("fixedId");
    if (!icon) missingFields.push("icon");
    if (!anatomy) missingFields.push("anatomy");
    const status = missingFields.length ? "MISSING" : "ready";
    console.log(
      `[mhwilds-update] Hunter's Manual roster: ${label} ${monster.id}/${variant.id} ${status}${missingFields.length ? ` (${missingFields.join(", ")})` : ""}`,
    );
    if (missingFields.length)
      missing.push(`${label} ${monster.id}/${variant.id}: ${missingFields.join(", ")}`);
  }

  console.log(
    `[mhwilds-update] Hunter's Manual audit: variants=${reportVariants.length} missing=${missing.length}`,
  );
  if (missing.length)
    throw new Error(`Hunter's Manual roster audit failed: ${missing.join("; ")}`);
}

function manualMonsterIds(data) {
  return [
    ...new Set(
      (data?.monsters ?? []).flatMap((monster) =>
        (monster.variants ?? [])
          .filter((variant) => variant.report?.anatomyLayout)
          .map(() => monster.id),
      ),
    ),
  ].sort();
}

function discoveredVisualPaths() {
  const manifest = readJson(path.join(ASSETS, "manifest.json"));
  return [
    ...new Set(
      (manifest?.selection?.discovery?.paths ?? []).filter(
        (archivePath) => typeof archivePath === "string" && archivePath.length > 0,
      ),
    ),
  ].sort();
}

function main(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  const previous = readJson(NORMALIZED);
  // The first pass scans the stable _00 visual path family for every possible
  // enemy id. This catches a DLC resource even when the upstream release list
  // has not been updated and the decoder tables are not yet reflected by the
  // asset index. The decoded report then supplies exact IDs for a focused
  // second pass over all historical visual filename shapes.
  const extraction = extractArgs(argv, {
    discover: !hasFlag(argv, "--no-discover"),
    discoveryIds: valuesAfter(argv, "--discover-id"),
  });
  run("extracting game resources", EXTRACT, extraction);
  run("decoding and normalizing game data", DECODE, decodeArgs(argv));

  let current = readJson(NORMALIZED);
  if (!current) throw new Error(`Normalized catalog was not written: ${NORMALIZED}`);

  if (!hasFlag(argv, "--no-discover")) {
    const ids = manualMonsterIds(current);
    if (ids.length) {
      const firstPassVisualPaths = discoveredVisualPaths();
      console.log(
        `[mhwilds-update] discovering Hunter's Manual visuals for ${ids.length} report-backed monster ids (preserving ${firstPassVisualPaths.length} broad-scan paths)`,
      );
      run(
        "extracting discovered Hunter's Manual visuals",
        EXTRACT,
        extractArgs(argv, {
          clean: false,
          discoveryIds: ids,
          paths: firstPassVisualPaths,
        }),
      );
      run("decoding discovered game data", DECODE, decodeArgs(argv));
      current = readJson(NORMALIZED);
      if (!current)
        throw new Error(`Normalized catalog was not written: ${NORMALIZED}`);
    }
  }

  run(
    "building runtime asset tree",
    BUILD,
    argv.includes("--no-clean") ? [] : ["--clean"],
  );
  logNewAdditions(previous, current);
  auditVisualRoster(current);
}

try {
  main(process.argv.slice(2).filter((arg) => arg !== "--"));
} catch (error) {
  console.error(`[mhwilds-update] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exitCode = 1;
}
