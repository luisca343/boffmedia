#!/usr/bin/env node
/**
 * Decode the extracted Wilds bestiary data with a local RE_RSZ-compatible
 * decoder, then normalize it for the bestiary UI.
 *
 * The decoder is intentionally not vendored. Place the community decoder and
 * its RSZ layout under laboon/tool-sources/mhwilds/mhdb-wilds-data. The game
 * files are copied from the ignored extraction directory into that ignored
 * decoder workspace; the Steam installation is never modified.
 *
 * Usage:
 *   pnpm decode:mhwilds-bestiary
 *   pnpm decode:mhwilds-bestiary -- --monster em0001
 *
 * Run extract:mhwilds-assets --convert first. The optional --monster filter is
 * passed to the normalizer, not used while decoding, because the shared report
 * tables are required to resolve the anatomy layout.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const DEFAULT_ASSETS = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/extracted/bestiary",
);
const DEFAULT_DECODER = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data",
);
const DECODER_CONFIG = path.join(HERE, "mhwilds-decoder.toml");
const NORMALIZER = path.join(HERE, "normalize-mhwilds-bestiary.mjs");

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/decode-mhwilds-bestiary.mjs [options]

Decode the extracted .user.3/.msg.23 files and produce bestiary-data.json.

Options:
  --assets <dir>       Extracted bestiary directory
  --decoder <dir>      Local mhdb-wilds-data decoder checkout
  --out <file>         Normalized output JSON
  --monster <id>       Restrict normalized output to an id, repeatable
  --help               Show this help`);
}

function parseArgs(argv) {
  const args = {
    assets: DEFAULT_ASSETS,
    decoder: DEFAULT_DECODER,
    out: null,
    monsters: [],
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
    switch (arg) {
      case "--assets":
        args.assets = next();
        break;
      case "--decoder":
        args.decoder = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--monster":
        args.monsters.push(next());
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
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
  const fromRepo = path.resolve(REPO, value);
  if (fs.existsSync(fromRepo)) return fromRepo;
  return fromCwd;
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function walkFiles(directory) {
  const files = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(filePath);
      else files.push(filePath);
    }
  }
  return files;
}

function removeLegacySketchAssets(decoderDirectory) {
  const roots = [
    path.join(decoderDirectory, "data", "natives"),
    path.join(decoderDirectory, "output", "user"),
  ];
  const legacyFiles = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const file of walkFiles(root)) {
      if (/(?:emsketch|enemyreportbosssketch|SketchTextureData)/i.test(file))
        legacyFiles.push(file);
    }
  }
  for (const file of legacyFiles) fs.rmSync(file, { force: true });
  return legacyFiles.length;
}

function copyDecoderInputs(assetsDirectory, decoderDirectory) {
  const sourceRoot = path.join(assetsDirectory, "natives");
  if (!fs.existsSync(sourceRoot))
    throw new Error(`Extracted natives directory not found: ${sourceRoot}`);

  const decoderDataRoot = path.join(decoderDirectory, "data", "natives");
  let copied = 0;
  for (const source of walkFiles(sourceRoot)) {
    if (!/\.(?:user\.3|msg\.23)$/i.test(source)) continue;
    const relative = path.relative(sourceRoot, source);
    if (relative.split(path.sep).includes(".."))
      throw new Error(`Unsafe extracted path: ${relative}`);
    const destination = path.join(decoderDataRoot, relative);
    ensureDirectory(path.dirname(destination));
    fs.copyFileSync(source, destination);
    copied += 1;
  }
  return copied;
}

function resolveDecoderExecutable(decoderDirectory) {
  const candidates = [
    path.join(decoderDirectory, "tools/extractor/target/release/extractor.exe"),
    path.join(decoderDirectory, "tools/extractor/target/release/extractor"),
  ];
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable)
    throw new Error(
      `RE_RSZ decoder not found under ${decoderDirectory}. Build tools/extractor first.`,
    );
  return executable;
}

function runDecoder(executable, decoderDirectory) {
  const result = spawnSync(
    executable,
    ["--config", DECODER_CONFIG, "--force", "usr", "--force", "msg"],
    { cwd: decoderDirectory, stdio: "inherit", windowsHide: true },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`RE_RSZ decoder failed with exit code ${result.status}`);
}

function runNormalizer(assetsDirectory, decodedDirectory, output, monsters) {
  const normalizerArgs = [
    NORMALIZER,
    "--assets",
    assetsDirectory,
    "--decoded",
    decodedDirectory,
  ];
  if (output) normalizerArgs.push("--out", output);
  for (const monster of monsters) normalizerArgs.push("--monster", monster);

  const result = spawnSync(process.execPath, normalizerArgs, {
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Bestiary normalizer failed with exit code ${result.status}`,
    );
}

try {
  const args = parseArgs(process.argv.slice(2));
  const assetsDirectory = resolvePath(args.assets);
  const decoderDirectory = resolvePath(args.decoder);
  const decodedDirectory = path.join(decoderDirectory, "output", "user");
  const output = args.out
    ? resolvePath(args.out)
    : path.join(assetsDirectory, "bestiary-data.json");
  const executable = resolveDecoderExecutable(decoderDirectory);
  console.log(`[mhwilds-decode] assets=${assetsDirectory}`);
  console.log(`[mhwilds-decode] decoder=${decoderDirectory}`);
  const removedSketches = removeLegacySketchAssets(decoderDirectory);
  if (removedSketches > 0)
    console.log(`[mhwilds-decode] removed=${removedSketches} legacy sketch assets`);
  const copied = copyDecoderInputs(assetsDirectory, decoderDirectory);
  console.log(`[mhwilds-decode] copied=${copied} decoder inputs`);
  runDecoder(executable, decoderDirectory);
  runNormalizer(assetsDirectory, decodedDirectory, output, args.monsters);
} catch (error) {
  console.error(
    `[mhwilds-decode] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  process.exitCode = 1;
}
