#!/usr/bin/env node
/**
 * Normalize the decoded Monster Hunter Wilds bestiary data into the small,
 * stable JSON shape consumed by tooling and the bestiary UI.
 *
 * This is deliberately a normalizer, not a proprietary binary decoder. The
 * local RE_RSZ-based decoder writes JSON into laboon/tool-sources/.../output/user;
 * this script joins that data to the asset index produced by
 * extract-mhwilds-assets.mjs and removes the game's implementation-shaped
 * fields from the application-facing result.
 *
 * Usage:
 *   pnpm normalize:mhwilds-bestiary
 *   pnpm normalize:mhwilds-bestiary -- --monster em0001
 *   node scripts/tools/mhwilds/normalize-mhwilds-bestiary.mjs \
 *     --assets laboon/tool-sources/mhwilds/extracted/bestiary \
 *     --decoded laboon/tool-sources/mhwilds/mhdb-wilds-data/output/user
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
const DEFAULT_ASSETS = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/extracted/bestiary",
);
const DEFAULT_DECODED = path.join(
  REPO,
  "laboon/tool-sources/mhwilds/mhdb-wilds-data/output/user",
);

const LANGUAGE_INDEXES = {
  en: 1,
  es: 5,
  es419: 32,
};

const ANATOMY_SLOTS = [
  "leftTop",
  "leftCenterUp",
  "leftCenterUnder",
  "leftBottom",
  "centerTop",
  "centerBottom",
  "rightTop",
  "rightCenterUp",
  "rightCenterUnder",
  "rightBottom",
];

// The report board has fixed edge slots. ArrowSize/ArrowRot describe the
// leader vector; the PNG is used to keep its endpoint on the corresponding
// anatomy drawing when the authored vector finishes in transparent margin.
// Keep these constants in sync with bestiary/anatomy-geometry.ts, which is the
// runtime fallback for packs generated before this field existed.
const ANATOMY_SLOT_ANCHORS = {
  leftTop: { x: 0, y: 17 },
  leftCenterUp: { x: 0, y: 35 },
  leftCenterUnder: { x: 0, y: 57 },
  leftBottom: { x: 0, y: 75 },
  centerTop: { x: 50, y: 17 },
  centerBottom: { x: 50, y: 78 },
  rightTop: { x: 100, y: 17 },
  rightCenterUp: { x: 100, y: 35 },
  rightCenterUnder: { x: 100, y: 57 },
  rightBottom: { x: 100, y: 75 },
};
const ANATOMY_CANVAS_SIZE = 512;
const ANATOMY_MIN_COORDINATE = 1;
const ANATOMY_MAX_COORDINATE = 99;
const ANATOMY_INK_THRESHOLD = 60;
const ANATOMY_SNAP_RADIUS = 64;
const ANATOMY_SLOT_KEYS = new Set(ANATOMY_SLOTS);

const INVALID_PART_TYPE = 486590176;

// EnemyWeakAttrData stores the actual element flags. EnemyReportBossData's
// recommendation is a separate bitmask and is deliberately kept as a
// fallback: for monsters such as Gogmazios the game recommends Fire + Dragon
// contextually, while the static weakness table can have no elemental flag.
const ELEMENT_WEAKNESS_FIELDS = [
  ["_Fire", "fire"],
  ["_Water", "water"],
  ["_Ice", "ice"],
  ["_Elec", "thunder"],
  ["_Dragon", "dragon"],
];
const RECOMMENDED_ELEMENT_BITS = [
  [2, "fire"],
  [4, "water"],
  [8, "ice"],
  [16, "thunder"],
  [32, "dragon"],
];

function printHelp() {
  console.log(`Usage: node scripts/tools/mhwilds/normalize-mhwilds-bestiary.mjs [options]

Join decoded game data to the ignored local bestiary asset index and write a
stable JSON document for the bestiary UI.

Options:
  --assets <dir>       Extracted bestiary directory (default: laboon/.../bestiary)
  --decoded <dir>      Decoded user output directory (default: laboon/.../output/user)
  --out <file>         Output JSON (default: <assets>/bestiary-data.json)
  --monster <id>       Restrict output to an id, repeatable
  --help               Show this help`);
}

function parseArgs(argv) {
  const args = {
    assets: DEFAULT_ASSETS,
    decoded: DEFAULT_DECODED,
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
      case "--decoded":
        args.decoded = next();
        break;
      case "--out":
        args.out = next();
        break;
      case "--monster":
        args.monsters.push(normalizeMonsterId(next()));
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

function normalizeMonsterId(value) {
  const normalized = value.toLowerCase().replace(/^em/, "");
  return `em${normalized.padStart(4, "0")}`;
}

function readJson(filePath, label = filePath) {
  if (!fs.existsSync(filePath))
    throw new Error(`Missing ${label}: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(
      `Invalid JSON in ${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function readOptionalJson(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

async function readAnatomyAlpha(pngPath) {
  if (!pngPath || !fs.existsSync(pngPath)) return null;
  try {
    const { data, info } = await sharp(pngPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return {
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    };
  } catch (error) {
    console.warn(
      `[mhwilds-normalize] anatomy alpha unavailable for ${pngPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

function anatomyPngPath(variant, assetsDirectory) {
  const png =
    variant?.anatomy && typeof variant.anatomy === "object"
      ? variant.anatomy.png
      : null;
  if (typeof png !== "string" || png.length === 0) return null;
  const resolved = path.join(assetsDirectory, png.replaceAll("\\", "/"));
  return fs.existsSync(resolved) ? resolved : null;
}

function anatomyAlphaAt(image, x, y) {
  if (!image || x < 0 || y < 0 || x >= image.width || y >= image.height)
    return 0;
  const pixel = (Math.round(y) * image.width + Math.round(x)) * image.channels;
  return image.data[pixel + image.channels - 1] || 0;
}

function clampAnatomyCoordinate(value) {
  return Math.min(
    ANATOMY_MAX_COORDINATE,
    Math.max(ANATOMY_MIN_COORDINATE, value),
  );
}

function snapAnatomyTarget(target, image) {
  if (!image) return target;
  const xScale = image.width / ANATOMY_CANVAS_SIZE;
  const yScale = image.height / ANATOMY_CANVAS_SIZE;
  const targetX = target.x * (ANATOMY_CANVAS_SIZE / 100) * xScale;
  const targetY = target.y * (ANATOMY_CANVAS_SIZE / 100) * yScale;
  if (anatomyAlphaAt(image, targetX, targetY) >= ANATOMY_INK_THRESHOLD)
    return target;

  const radiusX = ANATOMY_SNAP_RADIUS * xScale;
  const radiusY = ANATOMY_SNAP_RADIUS * yScale;
  let best = null;
  const minX = Math.max(0, Math.floor(targetX - radiusX));
  const maxX = Math.min(image.width - 1, Math.ceil(targetX + radiusX));
  const minY = Math.max(0, Math.floor(targetY - radiusY));
  const maxY = Math.min(image.height - 1, Math.ceil(targetY + radiusY));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (anatomyAlphaAt(image, x, y) < ANATOMY_INK_THRESHOLD) continue;
      const distance =
        ((x - targetX) / xScale) ** 2 + ((y - targetY) / yScale) ** 2;
      if (!best || distance < best.distance) best = { x, y, distance };
    }
  }
  if (!best || best.distance > ANATOMY_SNAP_RADIUS ** 2) return target;
  return {
    x: clampAnatomyCoordinate((best.x / xScale) * (100 / ANATOMY_CANVAS_SIZE)),
    y: clampAnatomyCoordinate((best.y / yScale) * (100 / ANATOMY_CANVAS_SIZE)),
  };
}

function normalizeAnatomyCallout(slot, anatomyAlpha) {
  const anchor = ANATOMY_SLOT_ANCHORS[slot.key];
  const arrow = slot.arrow;
  if (!anchor || !arrow?.visible) return null;
  if (!Number.isFinite(arrow.size) || !Number.isFinite(arrow.rotation))
    return null;
  const radians = ((arrow.rotation - 90) * Math.PI) / 180;
  const distance = (arrow.size / ANATOMY_CANVAS_SIZE) * 100;
  const target = {
    x: clampAnatomyCoordinate(anchor.x + Math.cos(radians) * distance),
    y: clampAnatomyCoordinate(anchor.y + Math.sin(radians) * distance),
  };
  return { anchor, target: snapAnatomyTarget(target, anatomyAlpha) };
}

function unknownAnatomySlots(layout) {
  if (!layout || typeof layout !== "object") return [];
  return Object.keys(layout)
    .filter((key) => key.startsWith("_") && key.endsWith("ArrowSize"))
    .map((key) => key.slice(1, -"ArrowSize".length))
    .filter(
      (slot) => !ANATOMY_SLOT_KEYS.has(slot[0].toLowerCase() + slot.slice(1)),
    )
    .map((slot) => slot[0].toLowerCase() + slot.slice(1));
}

function firstNumber(value) {
  const number = Array.isArray(value) ? value[0] : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isZeroGuid(value) {
  return value === "00000000-0000-0000-0000-000000000000";
}

function localizedEntry(entry) {
  if (!entry || !Array.isArray(entry.content)) return null;

  const values = {};
  for (const [language, contentIndex] of Object.entries(LANGUAGE_INDEXES)) {
    const value = entry.content[contentIndex];
    if (typeof value === "string" && value.length > 0) values[language] = value;
  }
  return Object.keys(values).length > 0 ? values : null;
}

function buildMessageMap(filePath) {
  const document = readOptionalJson(filePath);
  const entries = document?.entries;
  if (!Array.isArray(entries)) return new Map();
  return new Map(entries.map((entry) => [entry.guid, localizedEntry(entry)]));
}

function buildByNumber(values, field) {
  return new Map(
    (Array.isArray(values) ? values : [])
      .filter((value) => typeof value?.[field] === "number")
      .map((value) => [value[field], value]),
  );
}

function normalizeGameElementWeaknesses(record) {
  if (!record) return [];
  return ELEMENT_WEAKNESS_FIELDS.filter(
    ([field]) => record[field] === true,
  ).map(([, element]) => ({ element, level: 1 }));
}

function normalizeRecommendedElements(record) {
  const mask = firstNumber(record?._RecoAttributeBit?._Value);
  if (mask === null) return { elements: [], bits: null };
  return {
    elements: RECOMMENDED_ELEMENT_BITS.filter(
      ([bit]) => (mask & bit) !== 0,
    ).map(([, element]) => element),
    bits: mask,
  };
}

function listDecodedPartFiles(decodedDirectory) {
  const directory = path.join(decodedDirectory, "monsters", "parts");
  if (!fs.existsSync(directory)) return new Map();

  const files = new Map();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(
      /^((?:em)?\d+)_(\d+)_param_(parts|partsbreakreward|partseffect|partslost)\.json$/i,
    );
    if (!match) continue;
    const id = normalizeMonsterId(match[1]);
    const key = `${id}_${match[2]}`;
    const kind = match[3].toLowerCase();
    const record = files.get(key) || {};
    record[kind] = path.join(directory, entry.name);
    files.set(key, record);
  }
  return files;
}

function relativeAsset(asset) {
  if (typeof asset === "string") return asset;
  if (!asset || typeof asset !== "object") return null;
  return {
    raw: asset.raw || null,
    dds: asset.dds || null,
    png: asset.png || null,
  };
}

function normalizeAssets(variant) {
  const assets = {};
  for (const key of [
    "icon",
    "anatomy",
    "anatomyPrefab",
  ]) {
    if (variant[key]) assets[key] = relativeAsset(variant[key]);
  }
  return assets;
}

function normalizeHitzone(meat) {
  if (!meat) return null;
  return {
    slash: numberOrNull(meat._Slash),
    blunt: numberOrNull(meat._Blow),
    shot: numberOrNull(meat._Shot),
    fire: numberOrNull(meat._Fire),
    water: numberOrNull(meat._Water),
    thunder: numberOrNull(meat._Thunder),
    ice: numberOrNull(meat._Ice),
    dragon: numberOrNull(meat._Dragon),
    stun: numberOrNull(meat._Stun),
    lightPlant: numberOrNull(meat._LightPlant),
  };
}

function normalizePartType(type, nameMap) {
  if (!type) return null;
  return {
    index: numberOrNull(type._Index),
    iconType: numberOrNull(type._IconType),
    nameGuid: stringOrNull(type._EmPartsName),
    rottenNameGuid: stringOrNull(type._EmRottenPartsName),
    descriptionGuid: stringOrNull(type._EmPartsExp),
    name: nameMap.get(type._EmPartsName) || null,
    rottenName: nameMap.get(type._EmRottenPartsName) || null,
    description: nameMap.get(type._EmPartsExp) || null,
  };
}

function normalizeReward(reward) {
  return {
    index: numberOrNull(reward.RewardTableIndex),
    partType: numberOrNull(reward.PartsType),
    condition: numberOrNull(reward.RewardCondition),
    takeMax: numberOrNull(reward.RewardTakeMaxNum),
    targets: Array.isArray(reward.PartsBreakData)
      ? reward.PartsBreakData.map((target) => ({
          breakGuid: stringOrNull(target._BreakParts),
          level: numberOrNull(target._PartsBreakLevel),
        }))
      : [],
  };
}

function normalizeBreakType(type, nameMap) {
  if (!type) return null;
  return {
    index: numberOrNull(type._Index),
    type: numberOrNull(type._EmReportPartsBreakType),
    nameGuid: stringOrNull(type._EmReportPartsBreakTypeName),
    name: nameMap.get(type._EmReportPartsBreakTypeName) || null,
  };
}

function normalizeAnatomyLayout(
  layout,
  partTypesById,
  partNames,
  breakTypesById,
  breakTypeNames,
  anatomyAlpha,
) {
  if (!layout) return null;
  return {
    index: numberOrNull(layout._Index),
    slots: ANATOMY_SLOTS.map((slot) => {
      const sourceSlot = `${slot[0].toUpperCase()}${slot.slice(1)}`;
      const partType = numberOrNull(layout[`_${sourceSlot}`]);
      const breakType = numberOrNull(layout[`_${sourceSlot}PartsBreakType`]);
      const arrowSize = numberOrNull(layout[`_${sourceSlot}ArrowSize`]);
      return {
        key: slot,
        visible: partType !== null && partType !== INVALID_PART_TYPE,
        partType,
        part: normalizePartType(partTypesById.get(partType), partNames),
        breakType,
        break: normalizeBreakType(
          breakTypesById.get(breakType),
          breakTypeNames,
        ),
        arrow: {
          size: arrowSize,
          rotation: numberOrNull(layout[`_${sourceSlot}ArrowRot`]),
          visible: arrowSize !== null && arrowSize > 0,
        },
        callout: normalizeAnatomyCallout(
          {
            key: slot,
            arrow: {
              size: arrowSize,
              rotation: numberOrNull(layout[`_${sourceSlot}ArrowRot`]),
              visible: arrowSize !== null && arrowSize > 0,
            },
          },
          anatomyAlpha,
        ),
      };
    }),
  };
}

function normalizePartData(partsData, rewardsData, partTypes, partNames) {
  const meatByGuid = new Map(
    (Array.isArray(partsData._MeatArray) ? partsData._MeatArray : []).map(
      (meat) => [meat._InstanceGuid, meat],
    ),
  );
  const typeById = new Map(partTypes.map((type) => [type._EmPartsType, type]));
  const partByGuid = new Map();
  const parts = (
    Array.isArray(partsData._PartsArray) ? partsData._PartsArray : []
  ).map((part, index) => {
    const type = typeById.get(part._PartsType);
    const normalMeatGuid = stringOrNull(part._MeatGuidNormal);
    const breakMeatGuid = stringOrNull(part._MeatGuidBreak);
    const normalized = {
      index,
      id: stringOrNull(part._InstanceGuid),
      type: numberOrNull(part._PartsType),
      typeInfo: normalizePartType(type, partNames),
      health: firstNumber(part._Vital),
      healthStages: Array.isArray(part._Vital) ? part._Vital : [],
      hasHealth: part._IsEnablePartsVital === true,
      kinsectExtract: numberOrNull(part._RodExtract),
      meatGuid: {
        normal:
          normalMeatGuid && !isZeroGuid(normalMeatGuid) ? normalMeatGuid : null,
        break:
          breakMeatGuid && !isZeroGuid(breakMeatGuid) ? breakMeatGuid : null,
      },
      hitzone: normalizeHitzone(meatByGuid.get(normalMeatGuid)),
      breakHitzone: normalizeHitzone(meatByGuid.get(breakMeatGuid)),
      breaks: [],
      breakRewards: [],
    };
    if (normalized.id) partByGuid.set(normalized.id, normalized);
    return normalized;
  });

  const linkedPartTargets = new Map();
  for (const linked of Array.isArray(partsData._MultiPartsArray)
    ? partsData._MultiPartsArray
    : []) {
    for (const target of Array.isArray(linked._LinkPartsGuids)
      ? linked._LinkPartsGuids
      : []) {
      const targets = linkedPartTargets.get(linked._InstanceGuid) || [];
      targets.push(target);
      linkedPartTargets.set(linked._InstanceGuid, targets);
    }
  }

  const breaks = Array.isArray(partsData._PartsBreakArray)
    ? partsData._PartsBreakArray.map((breakData) => ({
        id: stringOrNull(breakData._InstanceGuid),
        targetCategory: numberOrNull(breakData._TargetCategory),
        targetDataGuid: stringOrNull(breakData._TargetDataGuid),
        targetPartGuids:
          breakData._TargetCategory === 1
            ? linkedPartTargets.get(breakData._TargetDataGuid) || []
            : [stringOrNull(breakData._TargetDataGuid)],
        executeCount: numberOrNull(breakData._ExcuteCount),
        maxCount: numberOrNull(breakData._MaxCount),
        condition: numberOrNull(breakData._Condition),
        conditionCount: numberOrNull(breakData._ConditionCount),
        partType: numberOrNull(breakData._PartsType),
      }))
    : [];

  for (const breakData of breaks) {
    for (const targetGuid of new Set(breakData.targetPartGuids)) {
      const part = partByGuid.get(targetGuid);
      if (part) part.breaks.push(breakData);
    }
  }

  const rewards = Array.isArray(rewardsData)
    ? rewardsData.map(normalizeReward)
    : [];
  const rewardByBreakGuid = new Map();
  for (const reward of rewards) {
    for (const target of reward.targets) {
      if (!target.breakGuid) continue;
      const entries = rewardByBreakGuid.get(target.breakGuid) || [];
      entries.push({ ...reward, level: target.level });
      rewardByBreakGuid.set(target.breakGuid, entries);
    }
  }
  for (const breakData of breaks) {
    const rewardEntries = rewardByBreakGuid.get(breakData.id) || [];
    for (const targetGuid of breakData.targetPartGuids) {
      const part = partByGuid.get(targetGuid);
      if (part) part.breakRewards.push(...rewardEntries);
    }
  }

  const multiParts = (
    Array.isArray(partsData._MultiPartsArray) ? partsData._MultiPartsArray : []
  ).map((multiPart) => ({
    id: stringOrNull(multiPart._InstanceGuid),
    health: firstNumber(multiPart._Vital),
    defaultEnabled: numberOrNull(multiPart._DefaultEnable),
    maxCount: numberOrNull(multiPart._MaxCount),
    action: numberOrNull(multiPart._Action),
    attribute: numberOrNull(multiPart._Attr),
    skipUpdateWhenBroken: multiPart._IsSkipUpdateLinkPartsWhenBroken === true,
    linkAll: multiPart._LinkAll === true,
    partGuids: Array.isArray(multiPart._LinkPartsGuids)
      ? multiPart._LinkPartsGuids
      : [],
    customizePriority: multiPart._IsCustomizePriority === true,
    priorityConditions: multiPart._PriorityConditions ?? null,
    enableLimitStop: multiPart._IsEnableLimitStop === true,
  }));

  const weakPoints = (
    Array.isArray(partsData._WeakPointArray) ? partsData._WeakPointArray : []
  ).map((weakPoint) => ({
    id: stringOrNull(weakPoint._InstanceGuid),
    health: firstNumber(weakPoint._Vital),
    meatGuid: stringOrNull(weakPoint._MeatGuid),
    linkPartGuid: isZeroGuid(weakPoint._LinkPartsGuid)
      ? null
      : stringOrNull(weakPoint._LinkPartsGuid),
    highlightEffectOffset: weakPoint._HighLightEffectOffset || null,
    highlightEffectType: numberOrNull(weakPoint._HighLightEffectType),
  }));

  const scarPoints = (
    Array.isArray(partsData._ScarPointArray) ? partsData._ScarPointArray : []
  ).map((scarPoint) => ({
    id: stringOrNull(scarPoint._InstanceGuid),
    normalHealth: firstNumber(scarPoint._NormalVital),
    tearHealth: firstNumber(scarPoint._TearVital),
    rawScarHealth: firstNumber(scarPoint._RawScarVital),
    meatGuid: stringOrNull(scarPoint._MeatGuid),
    linkPartGuid: stringOrNull(scarPoint._LinkPartsGuid),
    sizeRate: numberOrNull(scarPoint.SizeRate),
    count: numberOrNull(scarPoint._Num),
    stampSizeRate: numberOrNull(scarPoint.StampSizeRate),
  }));

  return {
    baseHealth: numberOrNull(partsData._BaseHealth),
    reactionPercent: firstNumber(partsData.ReactionPer),
    parts,
    breaks,
    rewards,
    multiParts,
    weakPoints,
    scarPoints,
    legendaryScarGroups: Array.isArray(partsData._LegendaryScarNumArray)
      ? partsData._LegendaryScarNumArray.map((entry) => ({
          group: numberOrNull(entry.Group),
          count: numberOrNull(entry.Num),
        }))
      : [],
  };
}

function normalizePartTypeCatalog(rawTypes, partNames) {
  return (Array.isArray(rawTypes) ? rawTypes : [])
    .map((type) => ({
      type: numberOrNull(type._EmPartsType),
      ...normalizePartType(type, partNames),
    }))
    .sort((a, b) => (a.type ?? 0) - (b.type ?? 0));
}

function buildIdentity(id, variant, emIds, enemyData, enemyNames) {
  const enumPrefix = `${id.toUpperCase()}_${variant}_`;
  const enumRecord = emIds.find(
    (entry) =>
      typeof entry._EnumName === "string" &&
      entry._EnumName.toUpperCase().startsWith(enumPrefix),
  );
  const fixedId = enumRecord?._FixedID;
  const data = enemyData.find((entry) => entry._enemyId === fixedId);
  if (!enumRecord && !data) return null;

  return {
    enumName: enumRecord?._EnumName || null,
    fixedId: numberOrNull(fixedId),
    nameGuid: stringOrNull(data?._EnemyName),
    descriptionGuid: stringOrNull(data?._EnemyExp),
    names: enemyNames.get(data?._EnemyName) || null,
    descriptions: enemyNames.get(data?._EnemyExp) || null,
    extraNames: enemyNames.get(data?._EnemyExtraName) || null,
    frenzyNames: enemyNames.get(data?._EnemyFrenzyName) || null,
    legendaryNames: enemyNames.get(data?._EnemyLegendaryName) || null,
    bossIconType: numberOrNull(data?._BossIconType),
  };
}

function copyAssetRecord(asset, assetsDirectory) {
  if (!asset || typeof asset !== "object") return asset || null;
  const result = { ...asset };
  for (const key of ["raw", "dds", "png"]) {
    if (!result[key]) continue;
    result[key] = result[key].replaceAll("\\", "/");
    if (
      key !== "raw" &&
      !fs.existsSync(path.join(assetsDirectory, result[key]))
    ) {
      result[key] = null;
    }
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const assetsDirectory = resolvePath(args.assets);
  const decodedDirectory = resolvePath(args.decoded);
  const outputFile = resolvePath(
    args.out || path.join(assetsDirectory, "bestiary-data.json"),
  );
  const assetIndexPath = path.join(assetsDirectory, "index.json");
  const index = readJson(assetIndexPath, "asset index");
  if (!Array.isArray(index.monsters))
    throw new Error(`Asset index has no monsters array: ${assetIndexPath}`);

  const partsTypesPath = path.join(
    decodedDirectory,
    "monsters",
    "EnemyPartsTypeData.json",
  );
  const emIdsPath = path.join(decodedDirectory, "monsters", "EmID.json");
  const enemyDataPath = path.join(
    decodedDirectory,
    "monsters",
    "EnemyData.json",
  );
  const partNamesPath = path.join(
    decodedDirectory,
    "..",
    "msg",
    "EnemyPartsTypeName.json",
  );
  const enemyTextPath = path.join(
    decodedDirectory,
    "..",
    "msg",
    "EnemyText.json",
  );
  const breakTypeNamesPath = path.join(
    decodedDirectory,
    "..",
    "msg",
    "EnemyReportPartsBreakTypeName.json",
  );
  const reportDirectory = path.join(decodedDirectory, "monsters", "report");

  const rawPartTypes = readJson(partsTypesPath, "EnemyPartsTypeData");
  const emIds = readJson(emIdsPath, "EmID");
  const enemyData = readJson(enemyDataPath, "EnemyData");
  const partNames = buildMessageMap(partNamesPath);
  const enemyNames = buildMessageMap(enemyTextPath);
  const breakTypeNames = buildMessageMap(breakTypeNamesPath);
  const rawBreakTypes =
    readOptionalJson(
      path.join(reportDirectory, "EnemyReportPartsBreakTypeData.json"),
    ) || [];
  const rawAnatomyLayouts =
    readOptionalJson(
      path.join(reportDirectory, "EnemyReportAnatomyPartsBreakData.json"),
    ) || [];
  const rawMeatDisplay =
    readOptionalJson(
      path.join(reportDirectory, "EnemyReportMeatDisplayData.json"),
    ) || [];
  const rawWeakAttributes =
    readOptionalJson(
      path.join(decodedDirectory, "monsters", "EnemyWeakAttrData.json"),
    ) || [];
  const rawBossData =
    readOptionalJson(path.join(reportDirectory, "EnemyReportBossData.json")) ||
    [];
  const partTypesById = new Map(
    rawPartTypes.map((type) => [type._EmPartsType, type]),
  );
  const breakTypesById = new Map(
    rawBreakTypes.map((type) => [type._EmReportPartsBreakType, type]),
  );
  const anatomyByFixedId = buildByNumber(rawAnatomyLayouts, "_EmID");
  const meatDisplayByFixedId = buildByNumber(rawMeatDisplay, "_EmID");
  const weakAttributesByFixedId = buildByNumber(
    rawWeakAttributes,
    "_EnumValue",
  );
  const bossDataByFixedId = buildByNumber(rawBossData, "_EmID");
  const decodedFiles = listDecodedPartFiles(decodedDirectory);
  const selectedIds = new Set(args.monsters);
  const selectedMonsters = index.monsters.filter(
    (monster) => selectedIds.size === 0 || selectedIds.has(monster.id),
  );

  if (selectedMonsters.length === 0)
    throw new Error(`No indexed monsters matched: ${args.monsters.join(", ")}`);

  const monsters = [];
  let missingParts = 0;
  let weaknessMapVariants = 0;
  let recommendationVariants = 0;
  let anatomyCallouts = 0;
  let anatomyMissingCallouts = 0;
  let anatomyAlphaImages = 0;
  let anatomyAlphaMissing = 0;
  const unknownAnatomySlotKeys = new Set();
  for (const monster of selectedMonsters) {
    const variants = [];
    for (const indexedVariant of monster.variants || []) {
      const key = `${monster.id}_${indexedVariant.id}`;
      const decoded = decodedFiles.get(key) || {};
      const data = decoded.parts
        ? normalizePartData(
            readJson(decoded.parts),
            decoded.partsbreakreward ? readJson(decoded.partsbreakreward) : [],
            rawPartTypes,
            partNames,
          )
        : null;
      if (indexedVariant.partData?.parts && !data) missingParts += 1;

      const identity = buildIdentity(
        monster.id,
        indexedVariant.id,
        emIds,
        enemyData,
        enemyNames,
      );
      const rawAnatomyLayout = anatomyByFixedId.get(identity?.fixedId);
      for (const slot of unknownAnatomySlots(rawAnatomyLayout))
        unknownAnatomySlotKeys.add(slot);
      const pngPath = anatomyPngPath(indexedVariant, assetsDirectory);
      if (rawAnatomyLayout && pngPath) anatomyAlphaImages += 1;
      else if (rawAnatomyLayout) anatomyAlphaMissing += 1;
      const anatomyAlpha = await readAnatomyAlpha(pngPath);
      const anatomyLayout = normalizeAnatomyLayout(
        rawAnatomyLayout,
        partTypesById,
        partNames,
        breakTypesById,
        breakTypeNames,
        anatomyAlpha,
      );
      for (const slot of anatomyLayout?.slots || []) {
        if (!slot.visible) continue;
        if (slot.callout) anatomyCallouts += 1;
        else anatomyMissingCallouts += 1;
      }
      const meatDisplay = meatDisplayByFixedId.get(identity?.fixedId);
      const elementalWeaknesses = normalizeGameElementWeaknesses(
        weakAttributesByFixedId.get(identity?.fixedId),
      );
      const recommended = normalizeRecommendedElements(
        bossDataByFixedId.get(identity?.fixedId),
      );
      if (elementalWeaknesses.length > 0) weaknessMapVariants += 1;
      if (recommended.elements.length > 0) recommendationVariants += 1;

      variants.push({
        id: indexedVariant.id,
        identity,
        assets: Object.fromEntries(
          Object.entries(normalizeAssets(indexedVariant)).map(
            ([assetKey, asset]) => [
              assetKey,
              typeof asset === "object"
                ? copyAssetRecord(asset, assetsDirectory)
                : asset,
            ],
          ),
        ),
        report: {
          anatomyLayout,
          hiddenPartType: numberOrNull(meatDisplay?._HiddenParts),
          elementalWeaknesses,
          recommendedElements: recommended.elements,
          recommendedAttributeBits: recommended.bits,
        },
        data,
        decodedFiles: Object.keys(decoded).sort(),
      });
    }
    monsters.push({ id: monster.id, variants });
  }

  const result = {
    schema: 1,
    generatedAt: new Date().toISOString(),
    source: {
      assetIndex: path.relative(REPO, assetIndexPath).replaceAll(path.sep, "/"),
      decodedDirectory: path
        .relative(REPO, decodedDirectory)
        .replaceAll(path.sep, "/"),
      hitzoneUnit: "percentage",
      weaknessTables: [
        "EnemyWeakAttrData.user.3",
        "EnemyReportBossData.user.3:_RecoAttributeBit",
      ],
      note: "Generated from a locally owned game installation. Do not commit or redistribute game-owned assets without clearance.",
    },
    partTypes: normalizePartTypeCatalog(rawPartTypes, partNames),
    partBreakTypes: rawBreakTypes
      .map((type) => normalizeBreakType(type, breakTypeNames))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
    monsters,
  };

  ensureDirectory(path.dirname(outputFile));
  fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  const variantCount = monsters.reduce(
    (count, monster) => count + monster.variants.length,
    0,
  );
  const partCount = monsters.reduce(
    (count, monster) =>
      count +
      monster.variants.reduce(
        (variantCountForMonster, variant) =>
          variantCountForMonster + (variant.data?.parts.length || 0),
        0,
      ),
    0,
  );
  console.log(
    `[mhwilds-normalize] monsters=${monsters.length} variants=${variantCount}`,
  );
  console.log(
    `[mhwilds-normalize] parts=${partCount} part-types=${result.partTypes.length}`,
  );
  console.log(
    `[mhwilds-normalize] elemental-weakness-maps=${weaknessMapVariants} recommendation-maps=${recommendationVariants}`,
  );
  console.log(
    `[mhwilds-normalize] anatomy-callouts=${anatomyCallouts} missing=${anatomyMissingCallouts}`,
  );
  console.log(
    `[mhwilds-normalize] anatomy-unknown-slots=${unknownAnatomySlotKeys.size}`,
  );
  console.log(
    `[mhwilds-normalize] anatomy-alpha-images=${anatomyAlphaImages} missing=${anatomyAlphaMissing}`,
  );
  if (rawWeakAttributes.length === 0)
    console.warn(
      "[mhwilds-normalize] EnemyWeakAttrData was not decoded; elemental game weakness rows are unavailable",
    );
  if (missingParts > 0)
    console.warn(
      `[mhwilds-normalize] missing decoded part data for ${missingParts} variants`,
    );
  if (unknownAnatomySlotKeys.size > 0)
    console.warn(
      `[mhwilds-normalize] unknown anatomy slots: ${[...unknownAnatomySlotKeys].join(", ")}`,
    );
  console.log(`[mhwilds-normalize] output=${outputFile}`);
}

try {
  await main();
} catch (error) {
  console.error(
    `[mhwilds-normalize] fatal: ${error instanceof Error ? error.stack || error.message : String(error)}`,
  );
  process.exitCode = 1;
}
