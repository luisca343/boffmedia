#!/usr/bin/env node
/**
 * Extract the Monster Hunter Wilds bestiary resources from a local Steam
 * installation.
 *
 * Wilds stores files in RE Engine PAK archives under hashed entries.  The
 * repository owns the selection, merge, provenance and output layout; the
 * small RETool-compatible executable does the proprietary PAK decoding.
 *
 * The default selection is intentionally narrow.  It extracts the game's own
 * bestiary icons, anatomy diagrams, shared equipment thumbnails, their
 * prefabs, and the report/part data that maps those resources to enemy ids. It
 * does not extract the full game or monster meshes unless an explicit
 * --include pattern is supplied.
 *
 * Local output is ignored by git (`laboon/`), because these are game-owned
 * assets and must never accidentally enter the source repository.
 *
 * Usage:
 *   pnpm extract:mhwilds-assets -- --dry-run
 *   pnpm extract:mhwilds-assets
 *   pnpm extract:mhwilds-assets -- --monster em0001 --convert
 *   pnpm extract:mhwilds-assets -- --include 'art/model/character/.*\\.mesh\\.'
 *
 * Requirements:
 *   - A current MHWs_STM_Release.list file from Ekey/REE.PAK.Tool.
 *   - REToolCustom (or another RETool-compatible executable) with -h/-l/-x.
 *   - DirectXTex's texconv.exe only when --convert is requested.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const DEFAULT_GAME =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\MonsterHunterWilds";
const DEFAULT_FILE_LIST = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/filelists/MHWs_STM_Release.list",
);
const DEFAULT_EXTRACTOR = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/extractor/REToolCustom-1.0/REtool.exe",
);
const DEFAULT_CONVERTER = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/converter/texconv.exe",
);
const DEFAULT_OUTPUT = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/extracted/bestiary",
);
const FILE_LIST_URL =
  "https://raw.githubusercontent.com/Ekey/REE.PAK.Tool/main/Projects/MHWs_STM_Release.list";
const EXTRACTOR_URL =
  "https://github.com/SlickAmogus/REToolCustom/releases/download/release/REToolCustom_1.0.zip";
const CONVERTER_URL =
  "https://github.com/microsoft/DirectXTex/releases/tag/may2026";
const TOOL_VERSION = 1;
const PER_MONSTER_PART_DATA_PATTERN =
  /^natives\/stm\/gamedesign\/enemy\/em\d+\/\d+\/data\/em\d+_\d+_param_parts(?:breakreward|effect|lost)?\.user\.3$/i;
const ITEM_THUMBNAIL_PATTERN =
  /^natives\/stm\/gui\/ui_texture\/tex080000\/tex_thumbnail\/item\/it\d{2}\/tex_it\d{4}_\d{4}_imlm4\.tex\./i;
const VISUAL_RESOURCE_PATTERN =
  /\/tex_emanatomy[^/]*\/tex_|\/enemyreportbossanatomytexture\//i;
const VISUAL_TEXTURE_PATH_PATTERN =
  /^natives\/stm\/gui\/ui_texture\/tex000000\/tex_(?:emanatomy|emicon_\d+)\/tex_(?:emanatomy|emicon)_em\d{4}_/i;
const LEGACY_SKETCH_PATH_PATTERN = /(?:tex_emsketch|enemyreportbosssketch)/i;
const VISUAL_ID_COUNT = 10_000;
const DEFAULT_VISUAL_TEMPLATES = [
  "natives/stm/gui/ui_texture/tex000000/tex_emanatomy/tex_emanatomy_{id}_00_0_imlm4.tex.241106027",
  "natives/stm/gui/ui_texture/tex000000/tex_emicon_00/tex_emicon_{id}_00_0_imlm4.tex.241106027",
];

const DEFAULT_PATTERNS = [
  /^natives\/stm\/gui\/ui_texture\/tex000000\/tex_emanatomy\/tex_emanatomy_.*\.tex\./i,
  /^natives\/stm\/gui\/ui_texture\/tex000000\/tex_emicon_\d+\/tex_emicon_.*\.tex\./i,
  ITEM_THUMBNAIL_PATTERN,
  /^natives\/stm\/gamedesign\/gui\/common\/_prefab\/enemyreportbossanatomytexture\/.*\.pfb\./i,
  PER_MONSTER_PART_DATA_PATTERN,
  /^natives\/stm\/gamedesign\/common\/enemy\/enemyreport(?:anatomypartsbreakdata|anatomypartsrewarddata|bossdata|bossmaterialdispdata|bossreleasedata|bosstitledata|partsbreaktypedata)\.user\.3$/i,
  /^natives\/stm\/gamedesign\/common\/enemy\/enemyreportmeatdisplaydata\.user\.3$/i,
  /^natives\/stm\/gamedesign\/enemy\/commondata\/data\/enemyweakattrdata\.user\.3$/i,
  /^natives\/stm\/gamedesign\/common\/enemy\/(?:enemydata|enemypartstypedata)\.user\.3$/i,
  /^natives\/stm\/gamedesign\/enemy\/commondata\/enummaker\/emid\.user\.3$/i,
  /^natives\/stm\/gamedesign\/text\/excel_data\/enemyreportbosstitledatatext\.msg\.23$/i,
  /^natives\/stm\/gamedesign\/text\/excel_data\/enemyreportpartsbreaktypename\.msg\.23$/i,
  /^natives\/stm\/gamedesign\/text\/excel_data\/enemypartstypename\.msg\.23$/i,
  /^natives\/stm\/gamedesign\/text\/excel_data\/enemytext\.msg\.23$/i,
  /^natives\/stm\/gamedesign\/text\/excel_data\/enemyspeciesname\.msg\.23$/i,
  /^natives\/stm\/gamedesign\/gui\/gui060000\/enemyicontexture\/.*$/i,
  /^natives\/stm\/gamedesign\/gui\/common\/_userdata\/enemyreportbossanatomytexturedata\.user\.3$/i,
];

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/extract-mhwilds-assets.mjs [options]

Extract the game's bestiary icons, anatomy textures and shared item
thumbnails into the ignored local tree under
laboon/tool-sources/mhwilds/extracted/bestiary. The output also contains
index.json for asset lookup and manifest.json for provenance.

Options:
  --game <dir>             Wilds installation directory
  --out <dir>              Output directory
  --file-list <file>       RE Engine path list
  --extractor <file>       RETool-compatible executable
  --monster <id>           Restrict visual resources to an id, repeatable
  --path <archive-path>    Add an exact archive path not present in the file list
  --include <regex>        Add a case-insensitive archive path pattern
  --exclude <regex>        Exclude a case-insensitive archive path pattern
  --discover-id <id>       Limit PAK visual discovery to an id, repeatable
  --no-discover            Do not scan patch PAK indexes for new visual paths
  --convert                Convert extracted .tex files to .png with texconv
  --image-converter <exe>  Converter executable (default: local texconv.exe)
  --download-list          Download the file list when it is missing
  --clean                  Remove this command's existing output before run
  --keep-work              Keep per-PAK temporary extraction directories
  --dry-run                Print selected paths and sizes; do not extract
  --help                   Show this help

The source game installation and the PAK archives are read-only inputs.  No
files are written below --game.`);
}

function parseArgs(argv) {
  const args = {
    game: process.env.MHWILDS_GAME_DIR || DEFAULT_GAME,
    out: DEFAULT_OUTPUT,
    fileList: DEFAULT_FILE_LIST,
    extractor: process.env.MHWILDS_RETOOL || DEFAULT_EXTRACTOR,
    imageConverter: DEFAULT_CONVERTER,
    monsters: [],
    paths: [],
    includes: [],
    excludes: [],
    discoveryIds: [],
    discover: true,
    convert: false,
    downloadList: false,
    clean: false,
    keepWork: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--") continue;
    const next = () => {
      const value = argv[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      return value;
    };

    switch (arg) {
      case "--game":
        args.game = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--file-list":
        args.fileList = next();
        break;
      case "--extractor":
        args.extractor = next();
        break;
      case "--monster":
        args.monsters.push(next().toLowerCase());
        break;
      case "--path":
        args.paths.push(next().replaceAll("\\", "/"));
        break;
      case "--include":
        args.includes.push(new RegExp(next(), "i"));
        break;
      case "--exclude":
        args.excludes.push(new RegExp(next(), "i"));
        break;
      case "--discover-id":
        args.discoveryIds.push(next().toLowerCase());
        break;
      case "--no-discover":
        args.discover = false;
        break;
      case "--image-converter":
        args.imageConverter = next();
        break;
      case "--convert":
        args.convert = true;
        break;
      case "--download-list":
        args.downloadList = true;
        break;
      case "--clean":
        args.clean = true;
        break;
      case "--keep-work":
        args.keepWork = true;
        break;
      case "--dry-run":
        args.dryRun = true;
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
  return path.resolve(process.cwd(), value);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const handle = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(handle);
  }
  return hash.digest("hex");
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Could not download ${url}: HTTP ${response.status}`);
  ensureDirectory(path.dirname(destination));
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

async function ensureFileList(args) {
  const fileList = resolvePath(args.fileList);
  if (!fs.existsSync(fileList)) {
    if (!args.downloadList) {
      throw new Error(
        `File list not found: ${fileList}\n` +
          `Download it from ${FILE_LIST_URL}, or rerun with --download-list.`,
      );
    }
    console.log(`[mhwilds-extract] downloading ${FILE_LIST_URL}`);
    await downloadFile(FILE_LIST_URL, fileList);
  }
  if (fs.statSync(fileList).size < 1000)
    throw new Error(`File list is unexpectedly small: ${fileList}`);
  return fileList;
}

function resolveExtractor(value) {
  const candidate = resolvePath(value);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    return candidate;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    const nested = path.join(candidate, "REtool.exe");
    if (fs.existsSync(nested)) return nested;
  }
  throw new Error(
    `RETool-compatible extractor not found: ${candidate}\n` +
      `Download REToolCustom from ${EXTRACTOR_URL}, unzip it, and pass --extractor <path-to-REtool.exe>.`,
  );
}

function getMonsterVariant(archivePath) {
  const dataPath = archivePath.match(/\/enemy\/(em\d+)\/(\d+)\/data\//i);
  if (dataPath) {
    return { id: dataPath[1].toLowerCase(), variant: dataPath[2] };
  }

  const assetPath = archivePath.match(/_(em\d+)_(\d+)_/i);
  if (assetPath) {
    return { id: assetPath[1].toLowerCase(), variant: assetPath[2] };
  }

  return null;
}

function isSharedDataPath(archivePath) {
  return (
    /^natives\/stm\/gamedesign\/common\/enemy\/(?:enemyreport|enemydata|enemypartstypedata)/i.test(
      archivePath,
    ) ||
    /^natives\/stm\/gamedesign\/enemy\/commondata\/data\/enemyweakattrdata\.user\.3$/i.test(
      archivePath,
    ) ||
    /^natives\/stm\/gamedesign\/enemy\/commondata\/enummaker\/emid\.user\.3$/i.test(
      archivePath,
    ) ||
    /^natives\/stm\/gamedesign\/text\/excel_data\/(?:enemyreport|enemytext|enemyspeciesname|enemypartstypename)/i.test(
      archivePath,
    ) ||
    /^natives\/stm\/gamedesign\/gui\/gui060000\/enemyicon/i.test(archivePath) ||
    ITEM_THUMBNAIL_PATTERN.test(archivePath) ||
    /^natives\/stm\/gamedesign\/gui\/common\/_userdata\/enemyreportbossanatomytexture/i.test(
      archivePath,
    )
  );
}

function readListedPaths(fileList) {
  return fs
    .readFileSync(fileList, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim().replaceAll("\\", "/"))
    .filter(Boolean);
}

function buildVisualPathTemplates(listedPaths) {
  const templates = new Set(DEFAULT_VISUAL_TEMPLATES);
  for (const archivePath of listedPaths) {
    if (!VISUAL_TEXTURE_PATH_PATTERN.test(archivePath)) continue;
    const match = archivePath.match(/^(.*?)(em\d{4})(.*)$/i);
    if (!match) continue;
    templates.add(`${match[1]}{id}${match[3]}`.toLowerCase());
  }
  return [...templates].sort();
}

function buildBroadVisualPathTemplates(listedPaths) {
  const templates = new Set(DEFAULT_VISUAL_TEMPLATES);
  for (const archivePath of listedPaths) {
    if (
      !VISUAL_TEXTURE_PATH_PATTERN.test(archivePath) ||
      !/(?:\/tex_emanatomy\/tex_emanatomy_|\/tex_emicon_00\/tex_emicon_)/i.test(
        archivePath,
      ) ||
      !/_00_0_imlm4\.tex\.\d+$/i.test(archivePath)
    )
      continue;
    const match = archivePath.match(/^(.*?)(em\d{4})(.*)$/i);
    if (!match) continue;
    templates.add(`${match[1]}{id}${match[3]}`.toLowerCase());
  }
  return [...templates].sort();
}

function normalizeMonsterId(value) {
  const normalized = value.toLowerCase().replace(/^em/, "");
  return `em${normalized.padStart(4, "0")}`;
}

function buildVisualDiscoveryCandidates(listedPaths, requestedIds = []) {
  const ids = requestedIds.length
    ? [...new Set(requestedIds.map(normalizeMonsterId))]
    : Array.from(
        { length: VISUAL_ID_COUNT },
        (_, index) => `em${String(index).padStart(4, "0")}`,
      );
  // A full scan deliberately starts with the stable, current manual page and
  // icon names. Once an ID is known, the updater runs a focused second pass
  // using every visual filename shape present in the release list. Keeping the
  // broad pass to these two templates is important: RETool hashes each
  // candidate, so expanding all historical variant/folder shapes to all 10k
  // IDs makes a clean DLC refresh needlessly expensive.
  const templates = requestedIds.length
    ? buildVisualPathTemplates(listedPaths)
    : buildBroadVisualPathTemplates(listedPaths);
  const candidates = new Set();
  for (const template of templates) {
    for (const id of ids) candidates.add(template.replace("{id}", id));
  }
  return { templates, ids, candidates: [...candidates].sort() };
}

function isPatchPak(pak) {
  return /\.patch_\d+\.pak$/i.test(path.basename(pak));
}

function discoverVisualPaths(fileList, paks, extractor, requestedIds = []) {
  const listedPaths = readListedPaths(fileList);
  const { templates, ids, candidates } = buildVisualDiscoveryCandidates(
    listedPaths,
    requestedIds,
  );
  const discoveryPaks = paks.filter((pak) => {
    if (!isPatchPak(pak)) return false;
    try {
      return fs.statSync(pak).size > 1024;
    } catch {
      return false;
    }
  });
  const discovered = new Set();
  const matchedPaks = [];
  const warnings = [];
  const workDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "mhwilds-visual-discovery-"),
  );
  const candidateList = path.join(workDirectory, "visual-candidates.list");
  fs.writeFileSync(candidateList, `${candidates.join("\n")}\n`, "utf8");

  try {
    for (const pak of discoveryPaks) {
      const result = spawnSync(
        extractor,
        ["-h", candidateList, "-l", "-trimList", pak],
        {
          cwd: workDirectory,
          stdio: "ignore",
          windowsHide: true,
        },
      );
      if (result.error) {
        warnings.push(`${path.basename(pak)}: ${result.error.message}`);
      } else if (result.status !== 0 && result.status !== 1) {
        warnings.push(`${path.basename(pak)}: RETool exited with ${result.status}`);
      }

      const trimmedList = path.join(workDirectory, "trimmed.list");
      if (fs.existsSync(trimmedList)) {
        const matches = readListedPaths(trimmedList).filter(
          (archivePath) =>
            VISUAL_TEXTURE_PATH_PATTERN.test(archivePath) &&
            !LEGACY_SKETCH_PATH_PATTERN.test(archivePath),
        );
        for (const archivePath of matches) discovered.add(archivePath);
        if (matches.length)
          matchedPaks.push({
            pak: path.basename(pak),
            paths: [...new Set(matches)].sort(),
          });
        fs.rmSync(trimmedList, { force: true });
      }

      for (const entry of fs.readdirSync(workDirectory)) {
        if (!entry.toLowerCase().endsWith(".txt")) continue;
        fs.rmSync(path.join(workDirectory, entry), { force: true });
      }
    }
  } finally {
    fs.rmSync(workDirectory, { recursive: true, force: true });
  }

  return {
    enabled: true,
    paks: discoveryPaks.map((pak) => path.basename(pak)),
    ids,
    templates,
    candidateCount: candidates.length,
    paths: [...discovered].sort(),
    matchedPaks,
    warnings,
  };
}

function readSelectedPaths(listedPaths, args, discoveredPaths = []) {
  const lines = [...new Set([...listedPaths, ...discoveredPaths, ...args.paths])];

  const monsterIds = args.monsters.map((id) => {
    const normalized = id.startsWith("em") ? id.slice(2) : id;
    return `em${normalized.padStart(4, "0")}`;
  });
  const visualMonsterIds = new Set(
    lines
      .filter((archivePath) => VISUAL_RESOURCE_PATTERN.test(archivePath))
      .map(getMonsterVariant)
      .filter(Boolean)
      .map(({ id }) => id),
  );
  const selected = [];

  for (const archivePath of lines) {
    if (LEGACY_SKETCH_PATH_PATTERN.test(archivePath)) continue;
    const explicitPath = args.paths.includes(archivePath);
    const defaultMatch = DEFAULT_PATTERNS.some((pattern) =>
      pattern.test(archivePath),
    );
    const includeMatch = args.includes.some((pattern) =>
      pattern.test(archivePath),
    );
    if (!defaultMatch && !includeMatch && !explicitPath) continue;
    if (args.excludes.some((pattern) => pattern.test(archivePath))) continue;

    if (
      monsterIds.length === 0 &&
      defaultMatch &&
      !includeMatch &&
      PER_MONSTER_PART_DATA_PATTERN.test(archivePath)
    ) {
      const monster = getMonsterVariant(archivePath);
      if (
        monster &&
        visualMonsterIds.size > 0 &&
        !visualMonsterIds.has(monster.id)
      ) {
        continue;
      }
    }

    if (monsterIds.length > 0) {
      const archiveMonster = getMonsterVariant(archivePath);
      const monsterMatch = monsterIds.some((id) => archiveMonster?.id === id);
      const sharedData = isSharedDataPath(archivePath);
      if (!monsterMatch && !sharedData) continue;
    }

    selected.push(archivePath);
  }

  return [...new Set(selected)].sort();
}

function writeFilteredList(filePath, selectedPaths) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${selectedPaths.join("\n")}\n`, "utf8");
}

function findGamePaks(gameDirectory) {
  const names = fs
    .readdirSync(gameDirectory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /^re_chunk_000\.pak(?:\.sub_000\.pak)?(?:\.patch_\d+\.pak)?$/i.test(
          entry.name,
        ),
    )
    .map((entry) => entry.name);

  const rank = (name) => {
    if (name === "re_chunk_000.pak") return 0;
    if (name === "re_chunk_000.pak.sub_000.pak") return 1;
    const patch = Number(name.match(/\.patch_(\d+)\.pak$/i)?.[1] || 0);
    const sub = name.includes(".sub_000.") ? 1 : 0;
    return 10 + patch * 2 + sub;
  };

  return names
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((name) => path.join(gameDirectory, name));
}

function runExtractor(extractor, fileList, pak, workDirectory) {
  const result = spawnSync(
    extractor,
    ["-h", fileList, "-x", "-skipUnknowns", "-noExtractDir", pak],
    {
      cwd: workDirectory,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  if (result.error) throw result.error;
  // REToolCustom exits with 1 after a successful extraction when the PAK has
  // unresolved entries.  `-skipUnknowns` is intentional here, so status 1 is
  // a warning rather than a failed run.  Statuses above 1 are real failures.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `Extractor failed for ${path.basename(pak)} with exit code ${result.status}`,
    );
  }
}

function walkFiles(directory) {
  const result = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else result.push(fullPath);
    }
  }
  return result;
}

function archiveRelativePath(filePath, workDirectory) {
  const relative = path
    .relative(workDirectory, filePath)
    .replaceAll(path.sep, "/");
  if (!relative.startsWith("natives/")) return null;
  if (relative.split("/").some((part) => part === ".."))
    throw new Error(`Unsafe extractor output path: ${relative}`);
  return relative;
}

function mergeExtractedFiles(workDirectory, outputDirectory, sourcePak) {
  const copied = [];
  for (const filePath of walkFiles(workDirectory)) {
    const relative = archiveRelativePath(filePath, workDirectory);
    if (!relative) continue;
    const destination = path.join(outputDirectory, relative);
    ensureDirectory(path.dirname(destination));
    fs.copyFileSync(filePath, destination);
    const stat = fs.statSync(destination);
    copied.push({
      path: relative,
      sourcePak: path.basename(sourcePak),
      bytes: stat.size,
    });
  }
  return copied;
}

function findCommand(command) {
  const result = spawnSync(
    process.platform === "win32" ? "where.exe" : "which",
    [command],
    {
      encoding: "utf8",
      windowsHide: true,
    },
  );
  if (result.status !== 0) return null;
  return result.stdout.trim().split(/\r?\n/)[0] || null;
}

function resolveConverter(value) {
  const candidate = resolvePath(value);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    return candidate;

  if (
    !path.isAbsolute(value) &&
    !value.includes("/") &&
    !value.includes("\\")
  ) {
    return findCommand(value);
  }

  return null;
}

function convertTextures(outputDirectory, converterPath) {
  const texFiles = walkFiles(outputDirectory).filter((filePath) =>
    /\.tex\.\d+$/i.test(filePath),
  );
  const itemThumbnailFiles = texFiles.filter((filePath) =>
    ITEM_THUMBNAIL_PATTERN.test(
      path.relative(outputDirectory, filePath).replaceAll(path.sep, "/"),
    ),
  );
  if (itemThumbnailFiles.length > 0) decodeItemThumbnails(outputDirectory);

  const converted = [];
  for (const texPath of texFiles) {
    const ddsPath = texPath.replace(/\.tex\.\d+$/i, ".dds");
    const pngPath = texPath.replace(/\.tex\.\d+$/i, ".png");
    const relativeTexPath = path
      .relative(outputDirectory, texPath)
      .replaceAll(path.sep, "/");
    if (!ITEM_THUMBNAIL_PATTERN.test(relativeTexPath)) {
      const texResult = spawnSync(
        resolveExtractorPathForTexture(),
        ["-tex", texPath],
        {
          stdio: "inherit",
          windowsHide: true,
        },
      );
      if (texResult.status !== 0 && texResult.status !== 1)
        throw new Error(`TEX conversion failed for ${texPath}`);
    }
    if (!fs.existsSync(ddsPath))
      throw new Error(`TEX converter did not produce DDS: ${ddsPath}`);

    const imageResult = spawnSync(
      converterPath,
      ["-y", "-nologo", "-ft", "png", "-o", path.dirname(ddsPath), ddsPath],
      {
        stdio: "inherit",
        windowsHide: true,
      },
    );
    if (imageResult.status !== 0)
      throw new Error(`DDS conversion failed for ${ddsPath}`);
    if (!fs.existsSync(pngPath))
      throw new Error(`Image converter did not produce PNG: ${pngPath}`);
    converted.push({
      source: path.relative(outputDirectory, texPath).replaceAll(path.sep, "/"),
      output: path.relative(outputDirectory, pngPath).replaceAll(path.sep, "/"),
    });
  }
  return converted;
}

function assertSafeCleanTarget(outputDirectory, gameDirectory) {
  const repoRelative = path.relative(REPO, outputDirectory);
  if (
    !repoRelative ||
    repoRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(repoRelative)
  ) {
    throw new Error(
      `Refusing --clean outside the repository: ${outputDirectory}`,
    );
  }

  const gameRelative = path.relative(gameDirectory, outputDirectory);
  if (
    !gameRelative ||
    (!gameRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(gameRelative))
  ) {
    throw new Error(
      `Refusing --clean inside the game installation: ${outputDirectory}`,
    );
  }
}

function replaceTextureExtension(filePath, extension) {
  return filePath.replace(/\.tex\.\d+$/i, extension);
}

function buildAssetIndex(outputDirectory, extractedFiles, converted) {
  const convertedBySource = new Map(
    converted.map((asset) => [asset.source, asset.output]),
  );
  const monsterMap = new Map();
  const itemThumbnails = new Map();

  const ensureVariant = (monsterId, variant) => {
    let monster = monsterMap.get(monsterId);
    if (!monster) {
      monster = { id: monsterId, variants: new Map() };
      monsterMap.set(monsterId, monster);
    }

    let variantAssets = monster.variants.get(variant);
    if (!variantAssets) {
      variantAssets = { id: variant };
      monster.variants.set(variant, variantAssets);
    }
    return variantAssets;
  };

  const makeTextureAsset = (filePath) => {
    const dds = replaceTextureExtension(filePath, ".dds");
    return {
      raw: filePath,
      dds: fs.existsSync(path.join(outputDirectory, dds)) ? dds : null,
      png: convertedBySource.get(filePath) || null,
    };
  };

  const addTexture = (filePath, kind, monsterId, variant) => {
    const asset = makeTextureAsset(filePath);
    ensureVariant(monsterId, variant)[kind] = asset;
  };

  for (const file of extractedFiles) {
    const filePath = file.path;
    const itemThumbnailMatch = filePath.match(
      /\/tex_thumbnail\/item\/(it\d{2})\/(tex_it\d{4})_(\d{4})_imlm4\.tex\.\d+$/i,
    );
    if (itemThumbnailMatch) {
      itemThumbnails.set(
        `${itemThumbnailMatch[1]}-${itemThumbnailMatch[3]}`,
        makeTextureAsset(filePath),
      );
      continue;
    }

    const textureMatch = filePath.match(
      /\/tex_(?:emanatomy|emicon)[^/]*\/tex_(emanatomy|emicon)_(em\d+)_(\d+)_/i,
    );
    if (textureMatch) {
      const kind = {
        emanatomy: "anatomy",
        emicon: "icon",
      }[textureMatch[1].toLowerCase()];
      addTexture(
        filePath,
        kind,
        textureMatch[2].toLowerCase(),
        textureMatch[3],
      );
      continue;
    }

    const prefabMatch = filePath.match(
      /\/enemyreportbossanatomytexture\/.*?_(em\d+)_(\d+)_/i,
    );
    if (prefabMatch) {
      ensureVariant(prefabMatch[1].toLowerCase(), prefabMatch[2]).anatomyPrefab =
        filePath;
    }

    const partDataMatch = filePath.match(
      /\/enemy\/(em\d+)\/(\d+)\/data\/em\d+_\d+_param_(partsbreakreward|partseffect|partslost|parts)\.user\.3$/i,
    );
    if (partDataMatch) {
      const kind = {
        parts: "parts",
        partsbreakreward: "breakReward",
        partseffect: "effect",
        partslost: "lost",
      }[partDataMatch[3].toLowerCase()];
      const variant = ensureVariant(
        partDataMatch[1].toLowerCase(),
        partDataMatch[2],
      );
      variant.partData ??= {};
      variant.partData[kind] = filePath;
    }
  }

  const monsters = [...monsterMap.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((monster) => ({
      id: monster.id,
      variants: [...monster.variants.values()].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    }));

  const serializedItemThumbnails = Object.fromEntries(
    [...itemThumbnails.entries()].sort(([a], [b]) => Number(a) - Number(b)),
  );

  const sharedData = extractedFiles
    .filter((file) => isSharedDataPath(file.path))
    .map((file) => ({
      path: file.path,
      bytes: file.bytes,
      sourcePak: file.sourcePak,
      sha256: file.sha256,
    }));

  return {
    schema: 1,
    generatedAt: new Date().toISOString(),
    monsters,
    itemThumbnails: serializedItemThumbnails,
    sharedData,
    note: "Paths are relative to this index.json file's directory.",
  };
}

let textureExtractor = null;
function resolveExtractorPathForTexture() {
  if (!textureExtractor)
    throw new Error("Internal error: texture extractor was not initialized");
  return textureExtractor;
}

function decodeItemThumbnails(outputDirectory) {
  const helper = path.join(
    REPO,
    "scripts/tools/mhwilds/decode-item-thumbnails.py",
  );
  const dll = path.join(path.dirname(textureExtractor), "libGDeflate.dll");
  if (!fs.existsSync(helper) || !fs.existsSync(dll))
    throw new Error(`Item thumbnail fallback requires ${helper} and ${dll}`);
  const result = spawnSync(
    process.env.MHWILDS_PYTHON || "python",
    [helper, "--root", outputDirectory, "--dll", dll],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.status !== 0)
    throw new Error("Item thumbnail GDeflate conversion failed");
}

function writeManifest(outputDirectory, data) {
  fs.writeFileSync(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

function writeAssetIndex(outputDirectory, data) {
  fs.writeFileSync(
    path.join(outputDirectory, "index.json"),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `[mhwilds-extract] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
    return;
  }

  const gameDirectory = resolvePath(args.game);
  const outputDirectory = resolvePath(args.out);
  const fileList = await ensureFileList(args);
  const extractor = resolveExtractor(args.extractor);

  if (
    !fs.existsSync(gameDirectory) ||
    !fs.statSync(gameDirectory).isDirectory()
  ) {
    throw new Error(`Game installation not found: ${gameDirectory}`);
  }

  const paks = findGamePaks(gameDirectory);
  if (paks.length === 0)
    throw new Error(`No re_chunk_000 PAK files found in ${gameDirectory}`);

  const listedPaths = readListedPaths(fileList);
  const discoveryIds = args.discoveryIds.length
    ? args.discoveryIds
    : args.monsters;
  const discovery = args.discover
    ? discoverVisualPaths(fileList, paks, extractor, discoveryIds)
    : {
        enabled: false,
        paks: [],
        ids: [],
        templates: [],
        candidateCount: 0,
        paths: [],
        matchedPaks: [],
        warnings: [],
      };
  if (discovery.enabled) {
    console.log(
      `[mhwilds-extract] visual-discovery=paks:${discovery.paks.length} ids:${discovery.ids.length} candidates:${discovery.candidateCount} matches:${discovery.paths.length}`,
    );
    for (const match of discovery.matchedPaks)
      console.log(
        `[mhwilds-extract] visual-discovery ${match.pak}: ${match.paths.join(", ")}`,
      );
    for (const warning of discovery.warnings)
      console.warn(`[mhwilds-extract] visual-discovery warning: ${warning}`);
  }

  const converterPath = args.convert
    ? resolveConverter(args.imageConverter)
    : null;
  if (args.convert && !converterPath)
    throw new Error(
      `Image converter not found: ${args.imageConverter}\n` +
        `Download texconv.exe from ${CONVERTER_URL}, or install Microsoft.DirectXTex.Texconv with winget.`,
    );

  const selectedPaths = readSelectedPaths(listedPaths, args, discovery.paths);
  if (selectedPaths.length === 0)
    throw new Error("No archive paths matched the requested selection");

  const selectedBytes = selectedPaths.reduce(
    (sum, archivePath) => sum + Buffer.byteLength(archivePath) + 1,
    0,
  );
  console.log(`[mhwilds-extract] game=${gameDirectory}`);
  console.log(
    `[mhwilds-extract] paks=${paks.length} file-list=${path.relative(REPO, fileList)}`,
  );
  console.log(
    `[mhwilds-extract] selected=${selectedPaths.length} paths (${formatBytes(selectedBytes)} filtered list)`,
  );
  console.log(`[mhwilds-extract] output=${outputDirectory}`);

  if (args.dryRun) {
    for (const selectedPath of selectedPaths) console.log(`  ${selectedPath}`);
    return;
  }

  if (args.clean) {
    assertSafeCleanTarget(outputDirectory, gameDirectory);
    if (fs.existsSync(outputDirectory))
      fs.rmSync(outputDirectory, { recursive: true, force: true });
  }
  ensureDirectory(outputDirectory);

  const filteredList = path.join(outputDirectory, ".mhwilds-selected.list");
  writeFilteredList(filteredList, selectedPaths);
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mhwilds-extract-"));
  const filesByPath = new Map();

  textureExtractor = extractor;
  try {
    for (const pak of paks) {
      const pakWork = path.join(workRoot, path.basename(pak));
      ensureDirectory(pakWork);
      console.log(`[mhwilds-extract] extracting ${path.basename(pak)}`);
      runExtractor(extractor, filteredList, pak, pakWork);
      for (const file of mergeExtractedFiles(pakWork, outputDirectory, pak))
        filesByPath.set(file.path, file);
      if (!args.keepWork) fs.rmSync(pakWork, { recursive: true, force: true });
    }
  } finally {
    if (!args.keepWork) fs.rmSync(workRoot, { recursive: true, force: true });
  }

  fs.rmSync(filteredList, { force: true });
  const extractedFiles = [...filesByPath.values()].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  const converted = args.convert
    ? convertTextures(outputDirectory, converterPath)
    : [];
  const sourcePaks = paks.map((pak) => {
    const stat = fs.statSync(pak);
    return {
      name: path.basename(pak),
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    };
  });

  for (const file of extractedFiles) {
    const fullPath = path.join(outputDirectory, file.path);
    file.sha256 = sha256File(fullPath);
  }

  writeAssetIndex(
    outputDirectory,
    buildAssetIndex(outputDirectory, extractedFiles, converted),
  );

  writeManifest(outputDirectory, {
    schema: TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    source: {
      game: "Monster Hunter Wilds",
      installation: "local Steam installation",
      paks: sourcePaks,
      fileList: {
        path: path.relative(REPO, fileList).replaceAll(path.sep, "/"),
        url: FILE_LIST_URL,
        sha256: sha256File(fileList),
      },
      extractor: {
        path: path.relative(REPO, extractor).replaceAll(path.sep, "/"),
        sha256: sha256File(extractor),
      },
      converter: converterPath
        ? {
            path: path.relative(REPO, converterPath).replaceAll(path.sep, "/"),
            sha256: sha256File(converterPath),
          }
        : null,
    },
    selection: {
      monsters: args.monsters,
      explicitPaths: args.paths,
      defaultPatterns: DEFAULT_PATTERNS.map((pattern) => pattern.source),
      includes: args.includes.map((pattern) => pattern.source),
      excludes: args.excludes.map((pattern) => pattern.source),
      discovery,
      paths: selectedPaths,
    },
    index: "index.json",
    extracted: extractedFiles,
    converted,
    note: "Generated from a locally owned game installation. Do not commit or redistribute without asset clearance.",
  });

  console.log(
    `[mhwilds-extract] extracted=${extractedFiles.length} files (${formatBytes(extractedFiles.reduce((sum, file) => sum + file.bytes, 0))})`,
  );
  if (converted.length)
    console.log(
      `[mhwilds-extract] converted=${converted.length} textures to PNG`,
    );
  console.log(
    `[mhwilds-extract] index=${path.join(outputDirectory, "index.json")}`,
  );
  console.log(
    `[mhwilds-extract] manifest=${path.join(outputDirectory, "manifest.json")}`,
  );
}

main().catch((error) => {
  console.error(
    `[mhwilds-extract] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  process.exitCode = 1;
});
