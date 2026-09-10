import { assetUrl, hasToolHost } from "@boffmedia/tool-kit";

export const MHWILDS_ASSET_ROOT = "/boffmedia/tools/mhwilds";
export const MHWILDS_BESTIARY_ASSET_ROOT = "/boffmedia/tools/mhwilds/bestiary";

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

const ITEM_KIND_ALIASES: Record<string, string> = {
  certificate: "ticket",
  medulla: "monster-part",
  gem: "monster-part",
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
  knife: "slinger-ammo",
  web: "spiderweb",
  "mystery-material": "monster-part",
  "mystery-artian": "monster-part",
  "mystery-decoration": "decoration",
};

const ITEM_COLOR_ALIASES: Record<string, string> = {
  gray: "grey",
  vermilion: "red",
  ivory: "white",
  rose: "pink",
  sky: "blue",
  emerald: "green",
  lemon: "yellow",
  "sage-green": "green",
  "moss-green": "green",
  ultramarine: "dark-blue",
  "blue-purple": "purple",
  none: "white",
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

  return mhwildsBestiaryAsset(
    `item-icons/${ITEM_KIND_ALIASES[kindSlug] ?? kindSlug}-${ITEM_COLOR_ALIASES[colorSlug] ?? colorSlug}.svg`,
    version,
  );
}

/** The root manifest is revalidated by the desktop asset cache. */
export function mhwildsManifestAsset(): string {
  return mhwildsAsset("manifest.json");
}
