import type { UnifiedBlock } from "./types";

/**
 * Parse a Minecraft blockstate string into a {@link UnifiedBlock}.
 *
 * Examples:
 *   "minecraft:stone"
 *   "minecraft:oak_stairs[facing=north,half=bottom,waterlogged=false]"
 *   "create:cogwheel[axis=y]"
 *
 * Blocks without an explicit namespace default to "minecraft".
 */
export function parseBlockState(raw: string): UnifiedBlock {
  let id = raw;
  const states: Record<string, string> = {};

  const bracket = raw.indexOf("[");
  if (bracket !== -1) {
    id = raw.slice(0, bracket);
    const inner = raw.slice(bracket + 1, raw.lastIndexOf("]"));
    if (inner.length > 0) {
      for (const pair of inner.split(",")) {
        const eq = pair.indexOf("=");
        if (eq === -1) continue;
        const key = pair.slice(0, eq).trim();
        const value = pair.slice(eq + 1).trim();
        if (key) states[key] = value;
      }
    }
  }

  const colon = id.indexOf(":");
  const namespace = colon === -1 ? "minecraft" : id.slice(0, colon);
  const name = colon === -1 ? id : id.slice(colon + 1);
  const fullId = colon === -1 ? `minecraft:${id}` : id;

  return {
    id: fullId,
    namespace,
    name,
    states,
    tags: [],
    source: namespace === "minecraft" ? "vanilla" : "mod",
    modId: namespace === "minecraft" ? undefined : namespace,
  };
}

/**
 * Convert a palette entry (block name + optional properties compound) into a
 * {@link UnifiedBlock}. Used by both the `.litematic` and `.nbt` structure loaders.
 */
export function parsePaletteEntry(
  name: string,
  props?: Record<string, string>
): UnifiedBlock {
  if (!props || Object.keys(props).length === 0) return parseBlockState(name);
  const inner = Object.entries(props)
    .map(([k, v]) => `${k}=${v}`)
    .join(",");
  return parseBlockState(`${name}[${inner}]`);
}

/** Serialize a {@link UnifiedBlock} back into a blockstate string. */
export function serializeBlockState(block: UnifiedBlock): string {
  const keys = Object.keys(block.states);
  if (keys.length === 0) return block.id;
  const stateStr = keys
    .sort()
    .map((k) => `${k}=${block.states[k]}`)
    .join(",");
  return `${block.id}[${stateStr}]`;
}
