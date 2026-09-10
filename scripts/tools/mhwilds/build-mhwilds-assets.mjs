#!/usr/bin/env node
/**
 * Build the publishable MH Wilds bestiary asset tree from the local extraction.
 *
 * The extractor keeps the complete game-facing tree under laboon/. The app only
 * needs the normalized JSON, the asset index, and the converted PNGs, so this
 * step creates a small runtime tree under public/boffmedia/tools/mhwilds.
 *
 * Usage:
 *   pnpm build:mhwilds-assets
 *   pnpm build:mhwilds-assets -- --clean
 *   node scripts/tools/mhwilds/build-mhwilds-assets.mjs --src <dir> --out <dir>
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const DEFAULT_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/extracted/bestiary",
);
const DEFAULT_OUTPUT = path.join(
  REPO,
  "public/boffmedia/tools/mhwilds/bestiary",
);
const ITEM_ICON_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/item-icons",
);
const BUILD_SCHEMA = 1;
const LEGACY_SKETCH_PATH_PATTERN = /(?:emsketch|enemyreportbosssketch)/i;

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/build-mhwilds-assets.mjs [options]

Options:
  --src <dir>   Extracted bestiary directory
  --out <dir>   Publishable asset directory
  --clean       Remove and rebuild only the resolved output directory
  --dry-run     Report files without writing them
  --help        Show this help`);
}

function parseArgs(argv) {
  const args = {
    src: DEFAULT_SOURCE,
    out: DEFAULT_OUTPUT,
    clean: false,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    const next = () => {
      const value = argv[++index];
      if (!value || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      return value;
    };
    if (arg === "--src") args.src = next();
    else if (arg === "--out") args.out = next();
    else if (arg === "--clean") args.clean = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function resolvePath(value) {
  if (path.isAbsolute(value)) return path.normalize(value);
  const normalizedValue = value.replaceAll("\\", "/");
  if (normalizedValue.startsWith("laboon/")) {
    const fromRepo = path.resolve(REPO, value);
    if (fs.existsSync(fromRepo)) return fromRepo;
  }
  const fromCwd = path.resolve(process.cwd(), value);
  if (fs.existsSync(fromCwd)) return fromCwd;
  return fromCwd;
}

function assertSafeTarget(target) {
  const resolved = path.resolve(target);
  const allowedRoots = [path.join(REPO, "public"), path.join(REPO, "apps")];
  if (
    !allowedRoots.some(
      (root) => resolved === root || resolved.startsWith(`${root}${path.sep}`),
    )
  ) {
    throw new Error(
      `Refusing to write outside the repository public/apps roots: ${resolved}`,
    );
  }
}

function walkFiles(directory) {
  const files = [];
  const stack = [directory];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else files.push(full);
    }
  }
  return files;
}

function sha256Files(files, sourceRoot) {
  const hash = crypto.createHash("sha256");
  for (const file of files.sort()) {
    hash.update(relativePosix(sourceRoot, file));
    hash.update("\0");
    if (file.toLowerCase().endsWith(".json")) {
      const json = JSON.parse(fs.readFileSync(file, "utf8"));
      if (json && typeof json === "object") delete json.generatedAt;
      hash.update(JSON.stringify(json));
    } else {
      hash.update(fs.readFileSync(file));
    }
  }
  return hash.digest("hex").slice(0, 16);
}

function copyFile(source, destination, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function relativePosix(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function copyStableJson(source, destination) {
  const json = JSON.parse(fs.readFileSync(source, "utf8"));
  // Keep already-extracted workspaces compatible with the clearer field name.
  if (json && json.itemIcons && !json.itemThumbnails) {
    json.itemThumbnails = json.itemIcons;
    delete json.itemIcons;
  }
  if (json && typeof json === "object") delete json.generatedAt;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

function collectPngReferences(value, references) {
  if (Array.isArray(value)) {
    for (const item of value) collectPngReferences(item, references);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    // These are the game's equipment thumbnails. They are retained in the
    // source index for audits, but the bestiary does not publish them.
    if (key === "itemThumbnails" || key === "itemIcons") continue;
    if (key === "png" && typeof child === "string") references.add(child);
    else collectPngReferences(child, references);
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  const source = resolvePath(args.src);
  const output = resolvePath(args.out);
  assertSafeTarget(output);

  if (!fs.existsSync(source))
    throw new Error(`Extraction directory not found: ${source}`);
  const dataFile = path.join(source, "bestiary-data.json");
  const indexFile = path.join(source, "index.json");
  if (!fs.existsSync(dataFile) || !fs.existsSync(indexFile)) {
    throw new Error(
      `Expected bestiary-data.json and index.json under ${source}`,
    );
  }

  const allPngFiles = walkFiles(path.join(source, "natives"))
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .filter((file) => !LEGACY_SKETCH_PATH_PATTERN.test(file))
    .sort();
  const pngReferences = new Set();
  collectPngReferences(
    JSON.parse(fs.readFileSync(dataFile, "utf8")),
    pngReferences,
  );
  collectPngReferences(
    JSON.parse(fs.readFileSync(indexFile, "utf8")),
    pngReferences,
  );
  const pngFiles = allPngFiles.filter((file) =>
    pngReferences.has(relativePosix(source, file)),
  );
  const itemIconFiles = fs.existsSync(ITEM_ICON_SOURCE)
    ? walkFiles(ITEM_ICON_SOURCE)
        .filter((file) => file.toLowerCase().endsWith(".svg"))
        .sort()
    : [];
  const runtimeEntries = [
    { source: dataFile, relative: "bestiary-data.json" },
    { source: indexFile, relative: "index.json" },
    ...pngFiles.map((file) => ({
      source: file,
      relative: relativePosix(source, file),
    })),
    ...itemIconFiles.map((file) => ({
      source: file,
      relative: path.posix.join("item-icons", path.basename(file)),
    })),
  ];
  const files = runtimeEntries.map((entry) => entry.source);
  const version = `game-${sha256Files(files, source)}-schema-${BUILD_SCHEMA}`;
  console.log(`[build-mhwilds-assets] src=${source}`);
  console.log(`[build-mhwilds-assets] out=${output}`);
  console.log(
    `[build-mhwilds-assets] files=${files.length} pngs=${pngFiles.length} item-icons=${itemIconFiles.length} version=${version}${args.dryRun ? " --dry-run" : ""}`,
  );

  if (args.dryRun) process.exit(0);

  if (args.clean && fs.existsSync(output))
    fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  copyStableJson(dataFile, path.join(output, "bestiary-data.json"));
  copyStableJson(indexFile, path.join(output, "index.json"));
  for (const entry of runtimeEntries) {
    if (entry.relative === "bestiary-data.json" || entry.relative === "index.json")
      continue;
    copyFile(entry.source, path.join(output, entry.relative), false);
  }

  // The manifest belongs to the tool root because pack-tool-assets.mjs reads
  // public/boffmedia/tools/<tool>/manifest.json. Existing API cache files in
  // that root stay available to the web app but are excluded from the optional
  // MH Wilds runtime pack below.
  const toolRoot = path.dirname(output);
  const excluded = walkFiles(toolRoot)
    .filter(
      (file) =>
        !file.startsWith(`${output}${path.sep}`) &&
        path.basename(file) !== "manifest.json",
    )
    .map((file) => relativePosix(toolRoot, file));
  fs.writeFileSync(
    path.join(toolRoot, "manifest.json"),
    `${JSON.stringify(
      {
        version,
        build: {
          tool: "mhwilds",
          schema: BUILD_SCHEMA,
          source: "Monster Hunter Wilds local extraction",
        },
        files: runtimeEntries.map((entry) =>
          path.posix.join(path.basename(output), entry.relative),
        ),
        excluded,
        notes: [
          "Runtime tree contains normalized bestiary data, selected game PNGs, and generic item glyph SVGs.",
          "Game item thumbnails are equipment renders; material rows use semantic kind/color glyphs.",
          "Raw game files remain in the ignored laboon extraction workspace.",
        ],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `[build-mhwilds-assets] wrote ${files.length} runtime files and ${path.join(toolRoot, "manifest.json")}`,
  );
} catch (error) {
  console.error(
    `[build-mhwilds-assets] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  process.exitCode = 1;
}
