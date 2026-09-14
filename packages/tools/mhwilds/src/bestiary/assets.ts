import { assetUrl, hasToolHost } from "@boffmedia/tool-kit";
import { normalizeAttributeKey } from "../ui/mh-helpers";

export const MHWILDS_ASSET_ROOT = "/boffmedia/tools/mhwilds";
export const MHWILDS_BESTIARY_ASSET_ROOT = "/boffmedia/tools/mhwilds/bestiary";
export const MHWILDS_GEAR_ASSET_ROOT = "/boffmedia/tools/mhwilds/bestiary/gear";
export const MHWILDS_ATTRIBUTE_ASSET_ROOT = "/boffmedia/tools/mhwilds/bestiary/attributes";
// Keep this in sync with the focused game-glyph remap in
// scripts/tools/mhwilds/build-mhwilds-assets.mjs. Attribute URLs do not load
// the large runtime manifest, so they need their own stable cache key.
const MHWILDS_ATTRIBUTE_ASSET_VERSION = "game-status-glyphs-schema-19";
const MHWILDS_ATTRIBUTE_ASSET_KEYS: Readonly<Record<string, string>> = {
  fire: "fire",
  water: "water",
  thunder: "thunder",
  ice: "ice",
  dragon: "dragon",
  poison: "poison",
  sleep: "sleep",
  paralysis: "paralysis",
  blast: "blast",
  // The game has no distinct blight glyphs; use the matching base artwork
  // without publishing duplicate PNGs.
  blastblight: "blast",
  fireblight: "fire",
  waterblight: "water",
  thunderblight: "thunder",
  iceblight: "ice",
  dragonblight: "dragon",
  stun: "stun",
  // Wilds exposes Exhaust as a status label, but its extracted icon font has
  // no ST_EXHAUST glyph. Do not substitute a misleading artwork cell.
};

export interface MhwildsArmorAssetManifestEntry {
  apiSetId?: string | number;
  gameId?: string | number;
  name?: string;
  assetSlug?: string;
  relative?: string | null;
  pieces?: Record<string, { relative?: string }>;
}

export interface MhwildsGearAssetManifest {
  version?: string;
  armor?: Record<string, MhwildsArmorAssetManifestEntry>;
  weapons?: Record<string, Record<string, string>>;
}

export interface MhwildsItemAssetManifestEntry {
  gameId?: string | number;
  name?: string | null;
  assetSlug?: string;
  asset?: string | null;
  assetSource?: string | null;
  available?: boolean;
  unavailableReason?: string | null;
  icon?: {
    kind?: string | null;
    color?: string | null;
    canonicalKind?: string | null;
    canonicalColor?: string | null;
  };
}

export interface MhwildsItemAssetManifest {
  schema?: number;
  version?: string;
  items?: Record<string, MhwildsItemAssetManifestEntry>;
  coverage?: {
    catalogItems?: number;
    availableItems?: number;
    missingItems?: number;
  };
}

export interface MhwildsItemAssetReference {
  gameId?: string | number;
  icon?: {
    kind?: string;
    color?: string;
  };
}

/** Kept as an alias for callers that only need the armor portion. */
export type MhwildsArmorAssetManifest = MhwildsGearAssetManifest;

let gearAssetManifestPromise: Promise<MhwildsGearAssetManifest | null> | null =
  null;
let itemAssetManifestPromise: Promise<MhwildsItemAssetManifest | null> | null =
  null;

function resolveAsset(root: string, path: string, version?: string): string {
  const rooted = `${root}/${path.replace(/^\/+/, "")}`;
  const versioned = version
    ? `${rooted}?v=${encodeURIComponent(version)}`
    : rooted;
  return hasToolHost() ? assetUrl(versioned) : versioned;
}

/** Resolve a path from the generated MH Wilds tool tree. */
export function mhwildsAsset(path: string, version?: string): string {
  return resolveAsset(MHWILDS_ASSET_ROOT, path, version);
}

/** Resolve a path from the generated bestiary subtree. */
export function mhwildsBestiaryAsset(path: string, version?: string): string {
  return resolveAsset(MHWILDS_BESTIARY_ASSET_ROOT, path, version);
}

/** Resolve a cropped game UI glyph for an element or ailment. */
export function mhwildsAttributeAsset(
  type: string | null | undefined,
  version?: string,
): string | null {
  const key = MHWILDS_ATTRIBUTE_ASSET_KEYS[normalizeAttributeKey(type ?? undefined)];
  if (!key) return null;
  return resolveAsset(
    MHWILDS_ATTRIBUTE_ASSET_ROOT,
    `${key}.png`,
    version ?? MHWILDS_ATTRIBUTE_ASSET_VERSION,
  );
}

export interface MhwildsWeaponAssetReference {
  kind?: string;
  type?: string;
  gameId?: number | string;
  localAssetPath?: string | null;
  localAssetVersion?: string;
}

/** Resolve an extracted weapon render from its manifest-joined local path. */
export function mhwildsWeaponAsset(
  weapon: MhwildsWeaponAssetReference | null | undefined,
  version?: string,
): string | null {
  if (!weapon?.localAssetPath) return null;
  return resolveAsset(
    MHWILDS_BESTIARY_ASSET_ROOT,
    weapon.localAssetPath,
    version ?? weapon.localAssetVersion,
  );
}

type ArmorAssetReference =
  | number
  | string
  | {
      armorSet?: {
        id?: number | string;
        gameId?: number | string;
      };
      kind?: string;
      localAssetPath?: string | null;
      localAssetVersion?: string;
    };

/** Resolve the extracted real preview for an armor set or one of its slots. */
export function mhwildsArmorAsset(
  pieceOrSet: ArmorAssetReference | null | undefined,
  version?: string,
): string | null {
  const localAssetPath =
    pieceOrSet && typeof pieceOrSet === "object"
      ? pieceOrSet.localAssetPath
      : undefined;
  if (localAssetPath !== undefined) {
    if (!localAssetPath) return null;
    return resolveAsset(
      MHWILDS_BESTIARY_ASSET_ROOT,
      localAssetPath,
      version ??
        (pieceOrSet as { localAssetVersion?: string }).localAssetVersion,
    );
  }
  // A readable path cannot be reconstructed safely from an API record. The
  // manifest join is authoritative; fail closed when the service has not
  // attached one instead of probing the old numeric-id tree.
  return null;
}

/** Resolve a catalogued item through the generated stable item manifest. */
export function mhwildsItemAsset(
  item: MhwildsItemAssetReference | null | undefined,
  manifest?: MhwildsItemAssetManifest | null,
  version?: string,
): string | null {
  const gameId = item?.gameId == null ? null : String(item.gameId);
  const entry = gameId ? manifest?.items?.[gameId] : undefined;
  const resolvedVersion = version ?? manifest?.version;
  if (entry?.asset) {
    return resolveAsset(
      MHWILDS_BESTIARY_ASSET_ROOT,
      entry.asset,
      resolvedVersion,
    );
  }
  return mhwildsItemIconAsset(
    item?.icon?.kind,
    item?.icon?.color,
    resolvedVersion,
  );
}

const ITEM_KIND_ALIASES: Record<string, string> = {
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
  // The Wilds enum contains these generic/unknown kinds, while the bundled
  // glyph source has no dedicated skull/question artwork. Preserve the
  // semantic colour with the generic monster-part family instead of
  // returning a broken image URL.
  skull: "monster-part",
  question: "monster-part",
  unknown: "monster-part",
};

const ITEM_COLOR_ALIASES: Record<string, string> = {
  gray: "grey",
  // MHDB uses the game's descriptive colour names while the bundled icon
  // family uses the nearest stable palette name.
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
};

// The upstream set has five exact bottle glyphs; use the complete medicine
// family only for the remaining bottle colours rather than discarding those
// exact shapes.
const PARTIAL_ICON_KIND_COLORS: Record<string, ReadonlySet<string>> = {
  bottle: new Set(["pink", "purple", "red", "white", "yellow"]),
};

function iconSlug(value: string | undefined): string | null {
  const slug = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || null;
}

/**
 * Resolve the generic material glyph for the game's semantic icon metadata.
 * `icon.id` is an enum value (e.g. 47 means Tail), not a texture filename.
 */
export function mhwildsItemIconAsset(
  kind: string | undefined,
  color: string | undefined,
  version?: string,
): string | null {
  const kindSlug = iconSlug(kind);
  const colorSlug = iconSlug(color);
  if (!kindSlug || !colorSlug) return null;

  const canonicalColor = ITEM_COLOR_ALIASES[colorSlug] ?? colorSlug;
  const canonicalKind = ITEM_KIND_ALIASES[kindSlug] ?? kindSlug;
  const availableColors = PARTIAL_ICON_KIND_COLORS[canonicalKind];
  const resolvedKind =
    availableColors && !availableColors.has(canonicalColor)
      ? "medicine"
      : canonicalKind;

  return mhwildsBestiaryAsset(
    `item-icons/${resolvedKind}-${canonicalColor}.svg`,
    version,
  );
}

/** Load the generated item-to-visual join once per page. */
export function loadMhwildsItemAssetManifest(): Promise<MhwildsItemAssetManifest | null> {
  if (!itemAssetManifestPromise) {
    itemAssetManifestPromise = fetch(
      mhwildsBestiaryAsset("items/manifest.json"),
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) return null;
        const value: unknown = await response.json();
        if (!value || typeof value !== "object") return null;
        const manifest = value as MhwildsItemAssetManifest;
        return manifest.items && typeof manifest.items === "object"
          ? manifest
          : null;
      })
      .catch(() => null);
  }
  return itemAssetManifestPromise;
}

/** The root manifest is revalidated by the desktop asset cache. */
export function mhwildsManifestAsset(): string {
  return mhwildsAsset("manifest.json");
}

/**
 * Load the generated armor index once per page. The builder records explicit
 * `pieces` entries, so a missing slot can be represented without making the
 * browser request a non-existent PNG and waiting for an onError fallback.
 */
export function loadMhwildsGearAssetManifest(): Promise<MhwildsGearAssetManifest | null> {
  if (!gearAssetManifestPromise) {
    gearAssetManifestPromise = fetch(
      mhwildsBestiaryAsset("gear/manifest.json"),
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) return null;
        const value: unknown = await response.json();
        if (!value || typeof value !== "object") return null;
        const manifest = value as MhwildsGearAssetManifest;
        return (manifest.armor && typeof manifest.armor === "object") ||
          (manifest.weapons && typeof manifest.weapons === "object")
          ? manifest
          : null;
      })
      .catch(() => null);
  }
  return gearAssetManifestPromise;
}

export function loadMhwildsArmorAssetManifest(): Promise<MhwildsArmorAssetManifest | null> {
  return loadMhwildsGearAssetManifest();
}
