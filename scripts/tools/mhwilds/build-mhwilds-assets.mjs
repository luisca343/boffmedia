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
import sharp from "sharp";

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
const ITEM_CATALOG_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/merged/Item.json",
);
const ITEM_MANIFEST_RELATIVE = "items/manifest.json";

// Item.json stores the game's semantic icon enum, while the current public
// source contains one shared, coloured glyph per semantic kind. Keep this
// mapping in the builder so the generated item manifest remains the single
// join point when authentic per-item artwork becomes available later.
const ITEM_KIND_ALIASES = Object.freeze({
  certificate: "ticket",
  medulla: "monster-part",
  gem: "monster-part",
  potion: "medicine",
  curative: "medicine",
  powder: "sac",
  extract: "sac",
  phial: "bottle",
  plant: "herb",
  mushroom: "mushroom-edible",
  fish: "fish-edible",
  meat: "meat-edible",
  bug: "bug-edible",
  smoke: "smoke-bomb",
  drug: "medicine",
  pill: "pill-edible",
  honey: "nectar",
  voucher: "ticket",
  "ammo-special": "slinger-ammo",
  "ammo-basic": "slinger-ammo",
  "ammo-slug": "slinger-ammo",
  "ammo-utility": "slinger-ammo",
  "ammo-heavy": "slinger-ammo",
  knife: "slinger-ammo",
  web: "spiderweb",
  "capture-net": "spiderweb",
  "camping-kit": "monster-part",
  grill: "barrel",
  "trap-tool": "trap",
  poop: "monster-part",
  nut: "seed",
  "fishing-rod": "whetstone",
  sprout: "seed",
  "cooking-cheese": "meat-edible",
  "cooking-mushroom": "mushroom-edible",
  "cooking-shellfish": "fish-edible",
  "cooking-egg": "egg",
  "cooking-garlic": "herb",
  "mystery-material": "monster-part",
  "mystery-artian": "monster-part",
  "mystery-decoration": "decoration",
  skull: "monster-part",
  question: "monster-part",
  unknown: "monster-part",
});

const ITEM_COLOR_ALIASES = Object.freeze({
  gray: "grey",
  vermilion: "orange",
  ivory: "light-brown",
  rose: "pink",
  sky: "deep-teal",
  emerald: "teal",
  lemon: "gold",
  "sage-green": "light-green",
  "moss-green": "dark-green",
  ultramarine: "dark-blue",
  "blue-purple": "purple",
  none: "white",
});

const PARTIAL_ITEM_GLYPH_COLORS = Object.freeze({
  bottle: new Set(["pink", "purple", "red", "white", "yellow"]),
});
// Bump whenever the published mapping/source selection changes. The version
// is appended to every browser asset URL; keeping it stable after a remap
// lets a persistent dev browser continue serving the old, incorrect PNGs.
const BUILD_SCHEMA = 16;
const ATTRIBUTE_ICON_ATLAS_RELATIVE =
  "natives/stm/gui/ui_texture/tex000000/tex000201_20_imlm4.png";
// The game's status/element atlas is a regular 8x8 64px grid. These cells are
// the nine entries used by EnemyReportWeaponAttributeData (1..9), in the same
// vocabulary as the extracted English/Spanish message tables.
const ATTRIBUTE_ICON_CELLS = Object.freeze({
  fire: [4, 2],
  water: [5, 1],
  thunder: [2, 2],
  ice: [1, 0],
  dragon: [4, 1],
  poison: [6, 2],
  sleep: [3, 2],
  paralysis: [1, 3],
  blast: [5, 2],
});
const LEGACY_SKETCH_PATH_PATTERN = /(?:emsketch|enemyreportbosssketch)/i;
const ARMOR_CATALOG_SOURCE = path.join(
  REPO,
  "public/boffmedia/tools/mhwilds/en/armor.json",
);
const RAW_ARMOR_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/merged/Armor.json",
);
const ARMOR_SERIES_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/user/gear/ArmorSeriesData.json",
);
const ARMOR_PACKAGE_SOURCE = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/user/gear",
);
const ARMOR_VISUAL_OVERRIDE_SOURCE = path.join(
  HERE,
  "armor-visual-overrides.json",
);
const ARMOR_THUMBNAIL_MAP_SOURCE = path.join(HERE, "armor-thumbnail-map.json");
const ARMOR_VISUAL_DATA_SOURCE = path.join(ARMOR_PACKAGE_SOURCE, "visual");
const WEAPON_CATALOG_SOURCE = path.join(
  REPO,
  "public/boffmedia/tools/mhwilds/en/weapons.json",
);
// The archive folder is not always the weapon family. For example, it10
// contains both tex_it1000 (insect glaives) and tex_it1003 (kinsects). Use the
// complete filename family so a non-weapon atlas can never overwrite a weapon
// render with the same numeric suffix.
const WEAPON_THUMBNAIL_KIND_BY_FAMILY = Object.freeze({
  tex_it0000: "great-sword",
  tex_it0100: "sword-shield",
  tex_it0200: "dual-blades",
  tex_it0300: "long-sword",
  tex_it0400: "hammer",
  tex_it0500: "hunting-horn",
  tex_it0600: "lance",
  tex_it0700: "gunlance",
  tex_it0800: "switch-axe",
  tex_it0900: "charge-blade",
  tex_it1000: "insect-glaive",
  tex_it1100: "bow",
  tex_it1200: "light-bowgun",
  tex_it1300: "heavy-bowgun",
});

// For the ordinary ch02/ch03 armor thumbnail namespace, the first numeric
// component is the set style (0=alpha/base, 1=beta, 2=gamma when present) and
// the final component is the piece index. Special/collaboration namespaces do
// not follow this convention; their slot is joined from PlayerArmorList.
const ARMOR_PIECE_KIND_BY_VARIANT = Object.freeze({
  0: "head",
  1: "chest",
  2: "arms",
  3: "waist",
  4: "legs",
});

const ARMOR_SET_VARIANT_BY_SUFFIX = Object.freeze({
  "\u03b1": 0,
  alpha: 0,
  "\u03b2": 1,
  beta: 1,
  "\u03b3": 2,
  gamma: 2,
});

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

/**
 * Re-encode game gear thumbnails before publishing them.
 *
 * DirectXTex writes these PNGs with a gAMA chunk set to 100000 (gamma 0.1).
 * Chromium honours that chunk when the image has transparency, which lifts
 * the foreground into the washed-out result seen in the tool. Sharp keeps
 * the RGBA pixels and alpha mask but omits the invalid game gamma metadata.
 */
async function copyGearPng(source, destination, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  await sharp(source).png().toFile(destination);
}

async function copyAttributePng(source, destination, crop, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  await sharp(source).extract(crop).png().toFile(destination);
}

function buildAttributeEntries(sourceRoot) {
  const source = path.join(sourceRoot, ATTRIBUTE_ICON_ATLAS_RELATIVE);
  if (!fs.existsSync(source)) {
    console.warn(
      `[build-mhwilds-assets] attribute atlas missing: ${source}; runtime will use the vector fallback`,
    );
    return [];
  }
  return Object.entries(ATTRIBUTE_ICON_CELLS).map(([key, [column, row]]) => ({
    source,
    relative: `attributes/${key}.png`,
    crop: { left: column * 64, top: row * 64, width: 64, height: 64 },
  }));
}

function assertUniqueRuntimeEntries(entries) {
  const byRelative = new Map();
  for (const entry of entries) {
    const existing = byRelative.get(entry.relative);
    if (existing && existing.source !== entry.source) {
      throw new Error(
        `Duplicate runtime asset path ${entry.relative}: ${existing.source} and ${entry.source}`,
      );
    }
    byRelative.set(entry.relative, entry);
  }
}

function relativePosix(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

/**
 * Convert a game-facing display name into a stable, locale-independent asset
 * path component. The generated path is presentation-only; game ids remain
 * the canonical join keys in the manifest and API payloads.
 */
function slugifyAssetName(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\u03b1/gu, "alpha")
    .replace(/\u03b2/gu, "beta")
    .replace(/\u03b3/gu, "gamma")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[\u0027\u2019]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function compareAssetIds(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber))
    return leftNumber - rightNumber;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

/** Assign deterministic names and suffix only actual slug collisions. */
function assignNamedAssetSlugs(
  entries,
  { nameKey = "name", idKey = "gameId", fallbackPrefix = "asset" } = {},
) {
  const groups = new Map();
  for (const entry of entries) {
    const base =
      slugifyAssetName(entry?.[nameKey]) ||
      `${fallbackPrefix}-${slugifyAssetName(entry?.[idKey]) || "unknown"}`;
    const group = groups.get(base) || [];
    group.push(entry);
    groups.set(base, group);
  }

  for (const [base, group] of groups) {
    const ordered = [...group].sort(
      (left, right) =>
        compareAssetIds(left?.[idKey], right?.[idKey]) ||
        String(left?.[nameKey] ?? "").localeCompare(
          String(right?.[nameKey] ?? ""),
        ),
    );
    ordered.forEach((entry, index) => {
      entry.assetSlug =
        ordered.length === 1
          ? base
          : `${base}-variant-${String(index + 1).padStart(2, "0")}`;
    });
  }
  return entries;
}

function assertNamedGearPaths(entries) {
  const numericPath =
    /^gear\/(?:armor\/[-]?\d+(?:\/|\.png)|weapons\/[^/]+\/[-]?\d+\.png)$/;
  const invalid = entries
    .map((entry) => entry.relative)
    .filter((relative) => numericPath.test(relative));
  if (invalid.length) {
    throw new Error(
      `Named gear build produced numeric public paths: ${invalid.join(", ")}`,
    );
  }
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

function readJsonIfPresent(filePath) {
  try {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile())
      return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function readItemCatalog() {
  if (!fs.existsSync(ITEM_CATALOG_SOURCE)) {
    throw new Error(`Item catalog is missing: ${ITEM_CATALOG_SOURCE}`);
  }
  const value = readJsonIfPresent(ITEM_CATALOG_SOURCE);
  if (!Array.isArray(value)) {
    throw new Error(`Item catalog is not an array: ${ITEM_CATALOG_SOURCE}`);
  }
  return value;
}

function itemIconReference(item) {
  const rawKind =
    typeof item?.icon === "string" ? item.icon : item?.icon?.kind;
  const rawColor = item?.icon_color ?? item?.icon?.color;
  const kind = slugifyAssetName(rawKind);
  const color = slugifyAssetName(rawColor);
  if (!kind || !color) {
    return {
      kind: rawKind == null ? null : String(rawKind),
      color: rawColor == null ? null : String(rawColor),
      relative: null,
      unavailableReason: "missing-icon-reference",
    };
  }

  const canonicalKind = ITEM_KIND_ALIASES[kind] ?? kind;
  const canonicalColor = ITEM_COLOR_ALIASES[color] ?? color;
  const availableColors = PARTIAL_ITEM_GLYPH_COLORS[canonicalKind];
  const resolvedKind =
    availableColors && !availableColors.has(canonicalColor)
      ? "medicine"
      : canonicalKind;

  return {
    kind: String(rawKind),
    color: String(rawColor),
    canonicalKind: resolvedKind,
    canonicalColor,
    relative: `item-icons/${resolvedKind}-${canonicalColor}.svg`,
    unavailableReason: null,
  };
}

/**
 * Build the stable item-to-visual join used by drops, crafting materials,
 * decorations, and any future item catalogue views.
 *
 * The item id is the game id from Item.json. The current visual is a shared
 * semantic glyph, so the manifest points at one existing SVG rather than
 * copying identical files under every item name. If a future extraction
 * provides a real per-item raster, only this manifest entry needs to change.
 */
function buildItemAssetManifest(itemIconFiles) {
  const availableGlyphs = new Set(
    itemIconFiles.map(
      (file) => `item-icons/${path.basename(file).toLowerCase()}`,
    ),
  );
  const records = readItemCatalog()
    .map((item) => ({
      gameId: normalizedGameId(item?.game_id ?? item?.gameId),
      name:
        item?.names?.en ??
        item?.names?.es ??
        item?.names?.["es-419"] ??
        item?.names?.ja ??
        null,
      item,
    }))
    .filter((item) => item.gameId != null);

  assignNamedAssetSlugs(records, {
    nameKey: "name",
    idKey: "gameId",
    fallbackPrefix: "item",
  });

  const entries = records
    .sort((left, right) => compareAssetIds(left.gameId, right.gameId))
    .map((record) => {
      const icon = itemIconReference(record.item);
      const asset =
        icon.relative && availableGlyphs.has(icon.relative.toLowerCase())
          ? icon.relative
          : null;
      const unavailableReason =
        asset == null
          ? icon.unavailableReason ?? "missing-semantic-glyph"
          : null;
      return [
        record.gameId,
        {
          gameId: record.gameId,
          name: record.name,
          assetSlug: record.assetSlug,
          asset,
          assetSource: asset == null ? null : "semantic-glyph",
          icon: {
            kind: icon.kind,
            color: icon.color,
            canonicalKind: icon.canonicalKind ?? null,
            canonicalColor: icon.canonicalColor ?? null,
          },
          available: asset != null,
          unavailableReason,
        },
      ];
    });
  const itemEntries = Object.fromEntries(entries);
  const availableItems = entries.filter(([, entry]) => entry.available).length;
  const missingEntries = entries.filter(([, entry]) => !entry.available);

  return {
    schema: 1,
    items: itemEntries,
    coverage: {
      catalogItems: entries.length,
      availableItems,
      missingItems: missingEntries.length,
      missingNames: missingEntries
        .map(([, entry]) => entry.name)
        .filter(Boolean),
      semanticGlyphItems: availableItems,
    },
    notes: [
      "Items are keyed by the stable game_id from Item.json; generated slugs are presentation-only.",
      "The current asset source is a shared semantic glyph, so repeated glyphs are not duplicated under every item name.",
      "A future game-owned or curated per-item asset can replace an entry's asset and assetSource without changing item consumers.",
      "The complete Item.json catalogue is published because the same items are reused by drops, crafting materials, charms, and decorations.",
    ],
  };
}

/**
 * Some collaboration/special armors deliberately use a different character
 * thumbnail model than the numeric model id stored in ArmorSeriesData. Keep
 * those joins explicit and reviewable rather than allowing a same-number
 * raster from an unrelated equipment namespace to win by accident.
 */
function readArmorVisualOverrides() {
  const value = readJsonIfPresent(ARMOR_VISUAL_OVERRIDE_SOURCE);
  if (!value || typeof value !== "object" || Array.isArray(value))
    return new Map();
  return new Map(
    Object.entries(value)
      .map(([key, override]) => {
        if (!override || typeof override !== "object") return null;
        const [modelId, subId] = key.split(":");
        if (!/^\d+$/.test(modelId ?? "") || !/^\d+$/.test(subId ?? ""))
          return null;
        const thumbnailModelId = Number(override.thumbnailModelId);
        if (!Number.isSafeInteger(thumbnailModelId)) return null;
        const missingSlots = Array.isArray(override.missingSlots)
          ? override.missingSlots.filter((slot) =>
              Object.values(ARMOR_SLOT_BY_FOLDER).includes(String(slot)),
            )
          : [];
        return [
          `${Number(modelId)}:${Number(subId)}`,
          {
            thumbnailModelId: String(thumbnailModelId),
            visualPartsNumber: Number.isSafeInteger(
              Number(override.visualPartsNumber),
            )
              ? Number(override.visualPartsNumber)
              : null,
            visualJoin:
              typeof override.visualJoin === "string"
                ? override.visualJoin
                : "PlayerArmorVisualSetting",
            missingSlots,
          },
        ];
      })
      .filter(Boolean),
  );
}

/**
 * ArmorSeriesData._ModId identifies the wearable prefab model. The game keeps
 * character thumbnail models in a separate namespace, so this relationship
 * must be an explicit data join rather than an arithmetic guess based on the
 * series index or wearable model id.
 */
function readArmorThumbnailMap() {
  const value = readJsonIfPresent(ARMOR_THUMBNAIL_MAP_SOURCE);
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !value.entries ||
    typeof value.entries !== "object" ||
    Array.isArray(value.entries)
  ) {
    throw new Error(
      `Armor thumbnail crosswalk is missing or invalid: ${ARMOR_THUMBNAIL_MAP_SOURCE}`,
    );
  }

  const map = new Map();
  for (const [seriesIndexToken, thumbnailModelToken] of Object.entries(
    value.entries,
  )) {
    if (
      !/^\d+$/.test(seriesIndexToken) ||
      !/^\d+$/.test(String(thumbnailModelToken))
    ) {
      throw new Error(
        `Armor thumbnail crosswalk contains a non-numeric join: ${seriesIndexToken} -> ${thumbnailModelToken}`,
      );
    }
    const seriesIndex = Number(seriesIndexToken);
    const thumbnailModelId = Number(thumbnailModelToken);
    if (
      !Number.isSafeInteger(seriesIndex) ||
      !Number.isSafeInteger(thumbnailModelId) ||
      thumbnailModelId <= 0
    ) {
      throw new Error(
        `Armor thumbnail crosswalk contains an unsafe join: ${seriesIndexToken} -> ${thumbnailModelToken}`,
      );
    }
    map.set(seriesIndex, String(thumbnailModelId));
  }
  if (!map.size)
    throw new Error(
      `Armor thumbnail crosswalk is empty: ${ARMOR_THUMBNAIL_MAP_SOURCE}`,
    );
  return map;
}

function readDecodedArmorVisualParts() {
  const partsByArmor = new Map();
  if (!fs.existsSync(ARMOR_VISUAL_DATA_SOURCE)) return partsByArmor;
  for (const file of walkFiles(ARMOR_VISUAL_DATA_SOURCE).filter((entry) =>
    /playerarmorvisualsetting.*\.json$/i.test(path.basename(entry)),
  )) {
    const records = readJsonIfPresent(file);
    if (!Array.isArray(records)) continue;
    for (const record of records) {
      for (const pair of record?._ArmorSettingPartsPairs || []) {
        const visualParts = Array.isArray(pair?._ArmorVisualPartsSettings)
          ? pair._ArmorVisualPartsSettings
          : [];
        const armorPairs = Array.isArray(pair?._ArmorPairSettings)
          ? pair._ArmorPairSettings
          : [];
        for (const armorPair of armorPairs) {
          const id = Number(armorPair?.STRUCT__ArmorID__ID);
          const subId = Number(armorPair?.STRUCT__ArmorID__SubID);
          const visualPartsNumber = Number(visualParts[0]?._PartsNumber);
          if (
            !Number.isSafeInteger(id) ||
            !Number.isSafeInteger(subId) ||
            !Number.isSafeInteger(visualPartsNumber)
          )
            continue;
          partsByArmor.set(`${id}:${subId}`, visualPartsNumber);
        }
      }
    }
  }
  return partsByArmor;
}

function classifyItemThumbnail(sourceRoot, file) {
  const relative = relativePosix(sourceRoot, file);
  const match = relative.match(
    /\/tex_thumbnail\/item\/(it\d+)\/(tex_it\d+)_([^/]+)_imlm4\.png$/i,
  );
  if (!match) return null;
  const gameId = /^\d+$/.test(match[3])
    ? String(Number(match[3]))
    : match[3].replace(/^0+(?=\d)/, "");
  return {
    source: file,
    relative,
    family: match[1].toLowerCase(),
    fullFamily: match[2].toLowerCase(),
    gameId,
    suffix: match[3].toLowerCase(),
  };
}

function classifyArmorThumbnail(sourceRoot, file) {
  const relative = relativePosix(sourceRoot, file);
  const ch02or03 = relative.match(
    /\/tex_thumbnail\/character\/(ch02|ch03)\/(tex_ch(?:02|03)_00_(\d+)_(\d+)_(\d+)_imlm4\.png)$/i,
  );
  if (ch02or03) {
    return {
      source: file,
      relative,
      family: ch02or03[1].toLowerCase(),
      modelId: String(Number(ch02or03[3])),
      setVariant: Number(ch02or03[4]),
      slotVariant: Number(ch02or03[5]),
    };
  }

  return null;
}

function armorSetVariant(name) {
  const token = String(name ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .at(-1);
  return token == null ? 0 : (ARMOR_SET_VARIANT_BY_SUFFIX[token] ?? 0);
}

const ARMOR_SLOT_BY_FOLDER = Object.freeze({
  Helm: "head",
  Body: "chest",
  Arm: "arms",
  Waist: "waist",
  Leg: "legs",
});
const ARMOR_THUMBNAIL_VARIANT_BY_PREFAB_PART = Object.freeze({
  3: 0, // Helm / ch02_*_0003.pfb
  2: 1, // Body
  1: 2, // Arm
  5: 3, // Waist
  4: 4, // Leg
});

/**
 * Read the game's PlayerArmorList packages. ArmorSeriesData points at a
 * model, but it does not describe which prefab belongs to each equipment
 * slot. The package table does, and is therefore the only safe source for a
 * model/slot join. A package can be present for both Male/ch02 and
 * Female/ch03; the raster thumbnail table decides which of those renders is
 * actually publishable.
 */
function readArmorVisualPackages() {
  const packages = new Map();
  if (!fs.existsSync(ARMOR_PACKAGE_SOURCE))
    return { packages, available: false };

  const files = walkFiles(ARMOR_PACKAGE_SOURCE)
    .filter((file) => /^PlayerArmorList.*\.json$/i.test(path.basename(file)))
    .sort();
  for (const file of files) {
    let rows;
    try {
      rows = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    // Depending on the decoder root/rsz mode, a PlayerArmorList can be
    // emitted directly as an array or as an object containing the male and
    // female arrays under _DataList/_FemaleDataList. Read both forms; the
    // prefab path itself carries the body type, so flattening them is safe.
    const rowLists = Array.isArray(rows)
      ? [rows]
      : rows && typeof rows === "object"
        ? Object.values(rows).filter((value) => Array.isArray(value))
        : [];
    for (const row of rowLists.flat()) {
      const armorId = Number(row?._ArmorID);
      const subId = Number(row?._ArmorSubID);
      if (!Number.isSafeInteger(armorId) || !Number.isSafeInteger(subId))
        continue;
      const key = `${armorId}:${subId}`;
      const packageEntries = packages.get(key) || [];
      // Keep an empty key as well: the row is authoritative even when this
      // package intentionally has no prefab for one or more slots.
      packages.set(key, packageEntries);
      const prefabs = row?._ArmorPackage?._PartsPrefabs;
      if (!Array.isArray(prefabs)) continue;
      for (const part of prefabs) {
        const prefab = typeof part?.v1 === "string" ? part.v1 : "";
        const match = prefab.match(
          /(?:^|\/)Armor\/(Male|Female)\/(\d+)\/(\d+)\/(Helm|Body|Arm|Waist|Leg)\/(ch02|ch03)_\d+_(\d+)\.pfb$/i,
        );
        if (!match) continue;
        const slot = Object.entries(ARMOR_SLOT_BY_FOLDER).find(
          ([folder]) => folder.toLowerCase() === match[4].toLowerCase(),
        )?.[1];
        if (!slot) continue;
        const modelId = String(Number(match[2]));
        // Catalog sub ids reserve the leading digits for the equipment
        // variety (010/100/300/500/etc.); thumbnail filenames keep only the
        // final visual style digit (0/1/2). Normalize that package folder
        // before joining it to a raster path.
        const style = Number(match[3]) % 10;
        const slotVariant =
          ARMOR_THUMBNAIL_VARIANT_BY_PREFAB_PART[Number(match[6]) % 10];
        if (!Number.isSafeInteger(style) || !Number.isSafeInteger(slotVariant))
          continue;
        const candidate = {
          gender: match[1].toLowerCase(),
          family: match[5].toLowerCase(),
          modelId,
          setVariant: style,
          slotVariant,
          slot,
          sourcePrefab: prefab,
        };
        const identity = [
          candidate.gender,
          candidate.family,
          candidate.modelId,
          candidate.setVariant,
          candidate.slotVariant,
        ].join(":");
        if (!packageEntries.some((entry) => entry.identity === identity))
          packageEntries.push({ ...candidate, identity });
      }
    }
  }
  return { packages, available: files.length > 0 };
}

function readArmorSetAssetTargets() {
  if (!fs.existsSync(ARMOR_CATALOG_SOURCE)) return new Map();

  const catalog = JSON.parse(fs.readFileSync(ARMOR_CATALOG_SOURCE, "utf8"));
  const rawArmor = fs.existsSync(RAW_ARMOR_SOURCE)
    ? JSON.parse(fs.readFileSync(RAW_ARMOR_SOURCE, "utf8"))
    : [];
  const modelByName = new Map(
    rawArmor
      .filter((record) => record?.names?.en != null)
      .map((record) => [String(record.names.en), String(record.model_id)]),
  );
  const seriesByGameId = new Map();
  if (fs.existsSync(ARMOR_SERIES_SOURCE)) {
    const series = readJsonIfPresent(ARMOR_SERIES_SOURCE);
    if (Array.isArray(series)) {
      for (const record of series) {
        if (record?._Series != null)
          seriesByGameId.set(String(record._Series), record);
      }
    }
  }
  const { packages: visualPackages, available: packageDataAvailable } =
    readArmorVisualPackages();
  const thumbnailMap = readArmorThumbnailMap();
  const visualOverrides = readArmorVisualOverrides();
  const decodedVisualParts = readDecodedArmorVisualParts();
  const targets = new Map();
  for (const piece of Array.isArray(catalog) ? catalog : []) {
    const set = piece?.armorSet;
    if (set?.id == null) continue;
    const apiSetId = String(set.id);
    const name = set.name == null ? null : String(set.name);
    const modelId = name == null ? null : (modelByName.get(name) ?? null);
    const raw = rawArmor.find((record) => String(record?.names?.en) === name);
    // MHDB documents armorSet.id as a mutable database id and armorSet.gameId
    // as the stable identifier from the game files. Prefer the local raw
    // game_id because it is the source used to discover the PNGs; only use
    // the catalog gameId when the raw merged record is unavailable. Never
    // publish a render under the mutable API id.
    const stableSetId =
      raw?.game_id != null
        ? String(raw.game_id)
        : set.gameId == null
          ? null
          : String(set.gameId);
    const targetKey = stableSetId ?? `unmapped-${apiSetId}`;
    if (targets.has(targetKey)) continue;
    const series =
      raw?.game_id == null ? null : seriesByGameId.get(String(raw.game_id));
    const packageSubIds = series
      ? {
          male: Number(series._ModSubMaleId),
          female: Number(series._ModSubFemaleId),
        }
      : { male: 0, female: 1 };
    const visualOverride =
      modelId == null
        ? null
        : visualOverrides.get(`${Number(modelId)}:${packageSubIds.male}`) ||
          visualOverrides.get(`${Number(modelId)}:${packageSubIds.female}`) ||
          null;
    const seriesIndex = Number(series?._Index);
    const mappedThumbnailModelId = Number.isSafeInteger(seriesIndex)
      ? (thumbnailMap.get(seriesIndex) ?? null)
      : null;
    const thumbnailModelId =
      visualOverride?.thumbnailModelId ?? mappedThumbnailModelId;
    const thumbnailJoin = visualOverride
      ? "armor-visual-overrides"
      : mappedThumbnailModelId == null
        ? null
        : "ArmorSeriesData._Index crosswalk";
    const visualOverrideKey = visualOverride
      ? `${Number(modelId)}:${
          visualOverrides.has(`${Number(modelId)}:${packageSubIds.male}`)
            ? packageSubIds.male
            : packageSubIds.female
        }`
      : null;
    const decodedVisualPartsNumber = visualOverrideKey
      ? (decodedVisualParts.get(visualOverrideKey) ?? null)
      : null;
    if (
      visualOverride &&
      decodedVisualPartsNumber != null &&
      visualOverride.visualPartsNumber != null &&
      decodedVisualPartsNumber !== visualOverride.visualPartsNumber
    ) {
      throw new Error(
        `Armor visual override ${visualOverrideKey} disagrees with decoded PlayerArmorVisualSetting (${decodedVisualPartsNumber} vs ${visualOverride.visualPartsNumber})`,
      );
    }
    const packageJoinAvailable =
      packageDataAvailable &&
      modelId != null &&
      (visualPackages.has(`${Number(modelId)}:${packageSubIds.male}`) ||
        visualPackages.has(`${Number(modelId)}:${packageSubIds.female}`));
    const visuals =
      modelId == null
        ? []
        : [
            ...new Set(
              [
                ...(visualPackages.get(
                  `${Number(modelId)}:${packageSubIds.male}`,
                ) || []),
                ...(visualPackages.get(
                  `${Number(modelId)}:${packageSubIds.female}`,
                ) || []),
              ].map((candidate) => JSON.stringify(candidate)),
            ),
          ].map((candidate) => JSON.parse(candidate));
    targets.set(targetKey, {
      apiSetId,
      modelId,
      thumbnailModelId: visualOverride?.thumbnailModelId ?? thumbnailModelId,
      visualPartsNumber: visualOverride?.visualPartsNumber ?? null,
      decodedVisualPartsNumber,
      visualOverride,
      thumbnailJoin,
      name,
      setVariant: armorSetVariant(name),
      gameId: stableSetId,
      seriesIndex: series?._Index ?? null,
      packageSubIds,
      packageJoinAvailable,
      visuals,
    });
  }
  assignNamedAssetSlugs([...targets.values()], {
    nameKey: "name",
    idKey: "gameId",
    fallbackPrefix: "armor-set",
  });
  return targets;
}

function armorVisualKey(candidate) {
  return [
    candidate.gender,
    candidate.family,
    candidate.modelId,
    candidate.setVariant,
    candidate.slotVariant,
  ].join(":");
}

function chooseArmorSourceVariant(candidates, requestedVariant) {
  const variants = [
    ...new Set(candidates.map((candidate) => candidate.setVariant)),
  ].sort((a, b) => a - b);
  if (!variants.length) return null;
  return variants.sort(
    (a, b) =>
      Math.abs(a - requestedVariant) - Math.abs(b - requestedVariant) || a - b,
  )[0];
}

function buildArmorEntries(sourceRoot, armorPngFiles) {
  const filesByModel = new Map();
  for (const file of armorPngFiles) {
    const thumbnail = classifyArmorThumbnail(sourceRoot, file);
    if (!thumbnail) continue;
    const files = filesByModel.get(thumbnail.modelId) || [];
    files.push(thumbnail);
    filesByModel.set(thumbnail.modelId, files);
  }

  const entries = [];
  const armor = {};
  for (const [setId, target] of readArmorSetAssetTargets()) {
    const thumbnailModelId = target.thumbnailModelId;
    const modelCandidates =
      thumbnailModelId == null
        ? []
        : [...(filesByModel.get(thumbnailModelId) || [])];
    const allowedVisuals = new Set((target.visuals || []).map(armorVisualKey));
    const hasSeparateVisualNamespace =
      thumbnailModelId != null && thumbnailModelId !== target.modelId;
    // If the authoritative package table was decoded, never infer a slot from
    // a same-model raster. This is the bug that made a gauntlet thumbnail look
    // like a helmet for sets such as Alloy and Artian. An empty intersection is
    // an honest unavailable mapping and is surfaced with its reason below.
    const candidates = (
      target.packageJoinAvailable
        ? modelCandidates.filter((candidate) =>
            [...allowedVisuals].some((key) => {
              const parts = key.split(":");
              return (
                parts[1] === candidate.family &&
                (hasSeparateVisualNamespace ||
                  parts[2] === candidate.modelId) &&
                Number(parts[3]) === candidate.setVariant &&
                Number(parts[4]) === candidate.slotVariant
              );
            }),
          )
        : modelCandidates
    ).sort(
      (a, b) =>
        (({ ch02: 0, ch03: 1 })[a.family] ?? 9) -
          ({ ch02: 0, ch03: 1 }[b.family] ?? 9) ||
        a.setVariant - b.setVariant ||
        a.slotVariant - b.slotVariant ||
        a.relative.localeCompare(b.relative),
    );
    const sourceSetVariant = chooseArmorSourceVariant(
      candidates,
      target.setVariant,
    );
    const styleCandidates = candidates.filter(
      (candidate) => candidate.setVariant === sourceSetVariant,
    );
    const preferredFamily = ["ch02", "ch03"].find((family) =>
      styleCandidates.some((candidate) => candidate.family === family),
    );
    const pieces = {};
    const pieceEntries = [];
    const selectedSources = {};
    for (const [variant, kind] of Object.entries(ARMOR_PIECE_KIND_BY_VARIANT)) {
      if (target.visualOverride?.missingSlots?.includes(kind)) continue;
      const slotVariant = Number(variant);
      const source =
        styleCandidates.find(
          (candidate) =>
            candidate.family === preferredFamily &&
            candidate.slotVariant === slotVariant,
        ) ||
        styleCandidates.find(
          (candidate) => candidate.slotVariant === slotVariant,
        );
      if (!source) continue;
      const relative = `gear/armor/${target.assetSlug}/${kind}.png`;
      pieceEntries.push({ source: source.source, relative });
      selectedSources[kind] = source;
      pieces[kind] = {
        modelId: target.modelId,
        thumbnailModelId,
        visualPartsNumber: target.visualPartsNumber,
        setVariant: source.setVariant,
        variant: source.slotVariant,
        source: source.relative,
        relative,
      };
    }

    const previewKind =
      Object.keys(pieces).find((kind) => kind === "head") ||
      Object.keys(pieces)[0] ||
      null;
    const preview = previewKind ? pieces[previewKind] : null;
    const previewSource = previewKind ? selectedSources[previewKind] : null;
    const previewRelative = previewSource
      ? `gear/armor/${target.assetSlug}/preview.png`
      : null;
    if (previewSource && previewRelative)
      entries.push({ source: previewSource.source, relative: previewRelative });
    entries.push(...pieceEntries);

    const availableSlots = Object.keys(pieces);
    const missingSlots = Object.values(ARMOR_PIECE_KIND_BY_VARIANT).filter(
      (kind) => !availableSlots.includes(kind),
    );
    const unavailableReason = previewSource
      ? null
      : target.modelId == null
        ? "no-raw-model-id"
        : target.thumbnailModelId == null
          ? "no-thumbnail-crosswalk"
          : modelCandidates.length === 0
            ? "no-extracted-thumbnail"
            : target.packageJoinAvailable && candidates.length === 0
              ? "thumbnail-package-slot-mismatch"
              : "no-compatible-thumbnail";
    armor[setId] = {
      name: target.name,
      apiSetId: target.apiSetId,
      gameId: target.gameId,
      modelId: target.modelId,
      thumbnailModelId,
      visualPartsNumber: target.visualPartsNumber,
      setVariant: target.setVariant,
      sourceSetVariant,
      setVariantFallback:
        sourceSetVariant == null || sourceSetVariant === target.setVariant
          ? null
          : "closest available game thumbnail variant",
      sourceFamily: previewSource?.family ?? null,
      thumbnailJoin: target.thumbnailJoin,
      visualJoin:
        target.visualOverride?.visualJoin ??
        (target.packageJoinAvailable ? "PlayerArmorList" : null),
      packageSubIds: target.packageSubIds,
      packageSlots: [
        ...new Set((target.visuals || []).map((candidate) => candidate.slot)),
      ].sort(),
      available: Boolean(previewSource),
      unavailableReason,
      modelCandidateCount: modelCandidates.length,
      compatibleCandidateCount: candidates.length,
      previewSlot: previewKind,
      source: preview?.source ?? null,
      assetSlug: target.assetSlug,
      relative: previewRelative,
      pieces,
      availableSlots,
      missingSlots,
    };
  }

  const armorSets = Object.values(armor);
  return {
    entries,
    manifest: {
      schema: 2,
      armor,
      coverage: {
        sets: armorSets.length,
        availableSets: armorSets.filter((set) => set.available).length,
        completeSets: armorSets.filter((set) => set.missingSlots.length === 0)
          .length,
        partialSets: armorSets.filter(
          (set) => set.available && set.missingSlots.length > 0,
        ).length,
        missingSets: armorSets.filter((set) => !set.available).length,
        noSourceSets: armorSets.filter(
          (set) => set.unavailableReason === "no-extracted-thumbnail",
        ).length,
        thumbnailCrosswalkMissingSets: armorSets.filter(
          (set) => set.unavailableReason === "no-thumbnail-crosswalk",
        ).length,
        mismatchedSets: armorSets.filter(
          (set) => set.unavailableReason === "thumbnail-package-slot-mismatch",
        ).length,
        unmappedSets: armorSets.filter((set) => set.modelId == null).length,
        unmappedSetNames: armorSets
          .filter((set) => set.modelId == null)
          .map((set) => set.name)
          .filter(Boolean),
        missingSetNames: armorSets
          .filter((set) => !set.available)
          .map((set) => set.name)
          .filter(Boolean),
        noSourceSetNames: armorSets
          .filter((set) => set.unavailableReason === "no-extracted-thumbnail")
          .map((set) => set.name)
          .filter(Boolean),
        thumbnailCrosswalkMissingSetNames: armorSets
          .filter((set) => set.unavailableReason === "no-thumbnail-crosswalk")
          .map((set) => set.name)
          .filter(Boolean),
        mismatchedSetNames: armorSets
          .filter(
            (set) =>
              set.unavailableReason === "thumbnail-package-slot-mismatch",
          )
          .map((set) => set.name)
          .filter(Boolean),
        availablePieces: armorSets.reduce(
          (total, set) => total + set.availableSlots.length,
          0,
        ),
      },
      notes: [
        "Armor assets are keyed by the stable MHDB armor-set gameId and slot (the API database id is retained as apiSetId for diagnostics).",
        "ArmorSeriesData._ModId is the wearable prefab model, not the character thumbnail model. The explicit armor-thumbnail-map.json crosswalk is the only set-to-thumbnail join; an unmapped set is left unavailable instead of guessing.",
        "For standard armor namespaces, slot joins come from PlayerArmorList prefabs and the thumbnail style/slot suffix; special namespaces are never interpreted by suffix alone.",
        "A raster is published only when its game thumbnail table contains the same family/model/style/slot. An empty package intersection is recorded as thumbnail-package-slot-mismatch instead of borrowing another armor piece.",
        "The named set-level preview uses the head slot when available, otherwise the first extracted slot.",
        "When a future set style has no distinct game thumbnail, the manifest records the closest available source style.",
        "Missing slots and unavailable set mappings remain listed in the manifest instead of silently removing the armor set or substituting a visually unrelated raster.",
      ],
    },
  };
}

function readWeaponCatalog() {
  if (!fs.existsSync(WEAPON_CATALOG_SOURCE)) return [];
  const catalog = JSON.parse(fs.readFileSync(WEAPON_CATALOG_SOURCE, "utf8"));
  return Array.isArray(catalog) ? catalog : [];
}

function buildWeaponAssetNames() {
  const records = readWeaponCatalog()
    .map((weapon) => ({
      ...weapon,
      kind: weapon?.kind == null ? null : String(weapon.kind),
      gameId: normalizedGameId(weapon?.gameId),
    }))
    .filter((weapon) => weapon.kind && weapon.gameId != null);
  assignNamedAssetSlugs(records, {
    nameKey: "name",
    idKey: "gameId",
    fallbackPrefix: "weapon",
  });

  return new Map(
    records.map((weapon) => [
      `${weapon.kind}:${weapon.gameId}`,
      {
        name: weapon.name == null ? null : String(weapon.name),
        assetSlug: weapon.assetSlug,
        relative: `gear/weapons/${weapon.kind}/${weapon.assetSlug}.png`,
      },
    ]),
  );
}

function buildWeaponCoverage(weapons, aliases) {
  const missing = readWeaponCatalog().filter((weapon) => {
    const kind = weapon?.kind;
    const gameId = normalizedGameId(weapon?.gameId);
    return !kind || gameId == null || !weapons[kind]?.[gameId];
  });
  const aliasCount = Object.values(aliases).reduce(
    (total, byGameId) => total + Object.keys(byGameId || {}).length,
    0,
  );
  return {
    catalogWeapons: readWeaponCatalog().length,
    availableWeapons: readWeaponCatalog().length - missing.length,
    missingWeapons: missing.length,
    missingNames: missing.map((weapon) => weapon?.name).filter(Boolean),
    aliasedWeapons: aliasCount,
  };
}

function normalizedGameId(value) {
  if (value == null || value === "") return null;
  const gameId = Number(value);
  return Number.isFinite(gameId) ? String(gameId) : null;
}

function buildWeaponAliases(weapons, weaponSources, weaponAssetNames, entries) {
  const catalog = readWeaponCatalog();
  const weaponsById = new Map(
    catalog
      .filter((weapon) => weapon?.id != null)
      .map((weapon) => [String(weapon.id), weapon]),
  );
  const aliases = {};

  for (const weapon of catalog) {
    const kind = weapon?.kind;
    const gameId = normalizedGameId(weapon?.gameId);
    if (!kind || gameId == null || weapons[kind]?.[gameId]) continue;

    const sameNameCandidates = catalog
      .filter(
        (candidate) =>
          candidate?.kind === kind &&
          candidate?.name === weapon.name &&
          normalizedGameId(candidate?.gameId) != null &&
          weaponSources.has(`${kind}:${normalizedGameId(candidate.gameId)}`),
      )
      .sort((a, b) => {
        const aGameId = Number(a.gameId);
        const bGameId = Number(b.gameId);
        return (
          Math.abs(aGameId - Number(gameId)) -
            Math.abs(bGameId - Number(gameId)) || aGameId - bGameId
        );
      });

    let sourceWeapon = sameNameCandidates[0];
    let reason = "same-name weapon variant has no distinct game thumbnail";
    if (!sourceWeapon) {
      const previous = weapon.crafting?.previous;
      const previousWeapon =
        previous?.id != null ? weaponsById.get(String(previous.id)) : null;
      const previousGameId = normalizedGameId(previousWeapon?.gameId);
      if (
        previousWeapon &&
        previousGameId != null &&
        weaponSources.has(`${kind}:${previousGameId}`)
      ) {
        sourceWeapon = previousWeapon;
        reason = "crafting predecessor has no distinct game thumbnail";
      }
    }

    if (!sourceWeapon) continue;
    const sourceGameId = normalizedGameId(sourceWeapon.gameId);
    const source = weaponSources.get(`${kind}:${sourceGameId}`);
    const asset = weaponAssetNames.get(`${kind}:${gameId}`);
    if (!source || !asset) continue;

    const relative = asset.relative;
    entries.push({ source: source.source, relative });
    weapons[kind] ||= {};
    weapons[kind][gameId] = relative;
    aliases[kind] ||= {};
    aliases[kind][gameId] = {
      relative,
      assetSlug: asset.assetSlug,
      source: source.relative,
      sourceGameId,
      reason,
    };
  }

  return aliases;
}

function buildGearEntries(sourceRoot, itemPngFiles, armorPngFiles) {
  const entries = [];
  const sourceToAsset = new Map();
  const weaponSources = new Map();
  const weapons = {};
  const weaponAssetNames = buildWeaponAssetNames();

  for (const file of itemPngFiles) {
    const thumbnail = classifyItemThumbnail(sourceRoot, file);
    if (!thumbnail) continue;

    const kind = WEAPON_THUMBNAIL_KIND_BY_FAMILY[thumbnail.fullFamily];
    const weaponAsset = kind
      ? weaponAssetNames.get(`${kind}:${thumbnail.gameId}`)
      : null;
    // Weapon thumbnails without a catalog record are not publishable runtime
    // assets: there is no stable name or API record that could reference them.
    // Keep them in the extraction workspace for a later catalog refresh rather
    // than reintroducing an opaque numeric public filename.
    const relative = kind ? weaponAsset?.relative ?? null : null;
    if (!relative) continue;

    entries.push({ source: file, relative });
    sourceToAsset.set(thumbnail.relative, relative);

    if (kind && weaponAsset) {
      weapons[kind] ||= {};
      weapons[kind][thumbnail.gameId] = relative;
      weaponSources.set(`${kind}:${thumbnail.gameId}`, {
        source: file,
        relative: thumbnail.relative,
      });
    }
  }

  const aliases = buildWeaponAliases(
    weapons,
    weaponSources,
    weaponAssetNames,
    entries,
  );
  const weaponCoverage = buildWeaponCoverage(weapons, aliases);

  const armorAssets = buildArmorEntries(sourceRoot, armorPngFiles);
  entries.push(...armorAssets.entries);

  return {
    entries,
    armorEntries: armorAssets.entries,
    sourceToAsset,
    manifest: {
      schema: 3,
      weapons,
      aliases,
      armor: armorAssets.manifest.armor,
      weaponCoverage,
      notes: [
        "Weapon manifest joins are keyed by weapon kind and stable gameId, while public paths use deterministic canonical-name slugs.",
        "Uncatalogued auxiliary item-thumbnail rasters remain in the ignored extraction workspace and are not published without a stable catalog name.",
        "When the installed game has no distinct raster for a variant, the alias records the real neighboring game render used for it.",
        "Armor manifest joins are keyed by stable armor-set gameId and slot; public paths use deterministic set-name slugs and missing slots remain visible in armorCoverage.",
        "Special armor visual namespaces are joined through the checked-in PlayerArmorVisualSetting override table and retain both source and thumbnail model ids.",
      ],
      armorCoverage: armorAssets.manifest.coverage,
    },
  };
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
  const itemPngFiles = allPngFiles.filter((file) =>
    /\/tex_thumbnail\/item\/it\d+\/tex_it\d+_[^/]+_imlm4\.png$/i.test(
      relativePosix(source, file),
    ),
  );
  const armorPngFiles = allPngFiles.filter((file) =>
    /\/tex_thumbnail\/character\/(?:ch02\/tex_ch02_00_\d+_\d+_\d+|ch03\/tex_ch03_00_\d+_\d+_\d+)_imlm4\.png$/i.test(
      relativePosix(source, file),
    ),
  );
  const gear = buildGearEntries(source, itemPngFiles, armorPngFiles);
  assertNamedGearPaths(gear.entries);
  const attributeEntries = buildAttributeEntries(source);
  const itemIconFiles = fs.existsSync(ITEM_ICON_SOURCE)
    ? walkFiles(ITEM_ICON_SOURCE)
        .filter((file) => file.toLowerCase().endsWith(".svg"))
        .sort()
    : [];
  const itemManifest = buildItemAssetManifest(itemIconFiles);
  const runtimeEntries = [
    { source: dataFile, relative: "bestiary-data.json" },
    { source: indexFile, relative: "index.json" },
    ...pngFiles.map((file) => ({
      source: file,
      relative: relativePosix(source, file),
    })),
    ...attributeEntries,
    ...gear.entries,
    ...itemIconFiles.map((file) => ({
      source: file,
      relative: path.posix.join("item-icons", path.basename(file)),
    })),
  ];
  assertUniqueRuntimeEntries(runtimeEntries);
  const files = runtimeEntries.map((entry) => entry.source);
  const provenanceFiles = [
    ARMOR_CATALOG_SOURCE,
    RAW_ARMOR_SOURCE,
    ITEM_CATALOG_SOURCE,
    WEAPON_CATALOG_SOURCE,
    ARMOR_SERIES_SOURCE,
    ARMOR_VISUAL_OVERRIDE_SOURCE,
    ARMOR_THUMBNAIL_MAP_SOURCE,
    ...(fs.existsSync(ARMOR_PACKAGE_SOURCE)
      ? walkFiles(ARMOR_PACKAGE_SOURCE).filter((file) =>
          /^PlayerArmorList.*\.json$/i.test(path.basename(file)),
        )
      : []),
    ...(fs.existsSync(ARMOR_VISUAL_DATA_SOURCE)
      ? walkFiles(ARMOR_VISUAL_DATA_SOURCE).filter((file) =>
          file.toLowerCase().endsWith(".json"),
        )
      : []),
  ].filter((file) => fs.existsSync(file));
  const version = `game-${sha256Files([...files, ...provenanceFiles], source)}-schema-${BUILD_SCHEMA}`;
  // Keep the same immutable pack identity on the nested gear manifest so
  // client-side armor joins can cache-bust their local raster URLs too.
  gear.manifest.version = version;
  itemManifest.version = version;
  console.log(`[build-mhwilds-assets] src=${source}`);
  console.log(`[build-mhwilds-assets] out=${output}`);
  console.log(
    `[build-mhwilds-assets] files=${files.length} pngs=${pngFiles.length} attribute-pngs=${attributeEntries.length} gear-pngs=${gear.entries.length} armor-pngs=${gear.armorEntries.length} item-icons=${itemIconFiles.length} item-catalog=${itemManifest.coverage.catalogItems} item-assets=${itemManifest.coverage.availableItems} version=${version}${args.dryRun ? " --dry-run" : ""}`,
  );
  const armorCoverage = gear.manifest.armorCoverage;
  const weaponCoverage = gear.manifest.weaponCoverage;
  console.log(
    `[build-mhwilds-assets] weapon-coverage=catalog:${weaponCoverage.catalogWeapons} available:${weaponCoverage.availableWeapons} missing:${weaponCoverage.missingWeapons} aliases:${weaponCoverage.aliasedWeapons}`,
  );
  if (weaponCoverage.missingWeapons > 0)
    console.warn(
      `[build-mhwilds-assets] weapon source is missing renders for ${weaponCoverage.missingWeapons} catalog weapons (${weaponCoverage.missingNames.join(", ")})`,
    );
  console.log(
    `[build-mhwilds-assets] armor-coverage=sets:${armorCoverage.sets} available:${armorCoverage.availableSets} complete:${armorCoverage.completeSets} partial:${armorCoverage.partialSets} missing:${armorCoverage.missingSets} unmapped:${armorCoverage.unmappedSets} crosswalk-missing:${armorCoverage.thumbnailCrosswalkMissingSets} pieces:${armorCoverage.availablePieces}`,
  );
  if (armorCoverage.unmappedSets > 0)
    console.warn(
      `[build-mhwilds-assets] armor catalog has no raw game model for ${armorCoverage.unmappedSets} sets (${armorCoverage.unmappedSetNames.join(", ")})`,
    );
  if (armorCoverage.missingSets > 0)
    console.warn(
      `[build-mhwilds-assets] armor source is missing previews for ${armorCoverage.missingSets} catalog sets (${armorCoverage.missingSetNames.join(", ")}); see gear/manifest.json armorCoverage.missingSlots`,
    );
  if (armorCoverage.thumbnailCrosswalkMissingSets > 0)
    console.warn(
      `[build-mhwilds-assets] armor thumbnail crosswalk is missing ${armorCoverage.thumbnailCrosswalkMissingSets} catalog sets (${armorCoverage.thumbnailCrosswalkMissingSetNames.join(", ")})`,
    );
  if (armorCoverage.mismatchedSets > 0)
    console.warn(
      `[build-mhwilds-assets] armor thumbnails were rejected because their package slots do not match ${armorCoverage.mismatchedSets} catalog sets (${armorCoverage.mismatchedSetNames.join(", ")})`,
    );
  if (itemManifest.coverage.missingItems > 0)
    console.warn(
      `[build-mhwilds-assets] item catalog has no semantic glyph for ${itemManifest.coverage.missingItems} items (${itemManifest.coverage.missingNames.join(", ")})`,
    );

  if (args.dryRun) process.exit(0);

  if (args.clean && fs.existsSync(output))
    fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  copyStableJson(dataFile, path.join(output, "bestiary-data.json"));
  copyStableJson(indexFile, path.join(output, "index.json"));
  for (const entry of runtimeEntries) {
    if (
      entry.relative === "bestiary-data.json" ||
      entry.relative === "index.json"
    )
      continue;
    const destination = path.join(output, entry.relative);
    if (entry.crop) {
      await copyAttributePng(entry.source, destination, entry.crop, false);
    } else if (entry.relative.startsWith("gear/") && entry.relative.endsWith(".png")) {
      await copyGearPng(entry.source, destination, false);
    } else {
      copyFile(entry.source, destination, false);
    }
  }
  fs.writeFileSync(
    path.join(output, "gear", "manifest.json"),
    `${JSON.stringify(gear.manifest, null, 2)}\n`,
    "utf8",
  );
  fs.mkdirSync(path.dirname(path.join(output, ITEM_MANIFEST_RELATIVE)), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(output, ITEM_MANIFEST_RELATIVE),
    `${JSON.stringify(itemManifest, null, 2)}\n`,
    "utf8",
  );

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
        files: [
          ...runtimeEntries.map((entry) =>
            path.posix.join(path.basename(output), entry.relative),
          ),
          path.posix.join(path.basename(output), "gear/manifest.json"),
          path.posix.join(path.basename(output), ITEM_MANIFEST_RELATIVE),
        ],
        excluded,
        notes: [
          "Runtime tree contains normalized bestiary data, selected game PNGs, cropped game element/ailment glyphs, generic item glyph SVGs, a stable item asset manifest, weapon gear renders, and armor slot previews.",
          "Weapon and armor manifest joins retain stable game ids, while generated gear paths use canonical-name slugs.",
          "Item manifest joins retain stable game ids and readable item slugs; current entries point at shared semantic glyphs without duplicating identical SVG files.",
          "Gear thumbnails are republished as RGBA PNGs with the game's invalid DirectXTex gamma metadata removed; this preserves the foreground alpha mask and prevents browser washout. Do not flatten these PNGs during publication.",
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
