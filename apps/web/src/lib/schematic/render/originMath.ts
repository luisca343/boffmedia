import type { Vec3 } from "./picking";

export interface SourceAnchor {
  origin?: Vec3;
  offset?: Vec3;
  /** Where the player stood when the copy was made. Needs both inputs. */
  playerPos?: Vec3;
}

/**
 * WorldEdit convention: `WEOrigin` is the world position of the copy's min
 * corner, and `WEOffset` is that same min corner expressed relative to the
 * player who ran //copy. Therefore player = origin - offset.
 */
export function sourceAnchor(origin?: Vec3, offset?: Vec3): SourceAnchor {
  const anchor: SourceAnchor = {};
  if (origin) anchor.origin = origin;
  if (offset) anchor.offset = offset;
  if (origin && offset) {
    anchor.playerPos = { x: origin.x - offset.x, y: origin.y - offset.y, z: origin.z - offset.z };
  }
  return anchor;
}

/**
 * The player's position in schematic-local coords, where the min corner is
 * (0,0,0) — i.e. the negated offset. Used to place the 3D marker.
 */
export function localPlayerPos(offset?: Vec3): Vec3 | undefined {
  if (!offset) return undefined;
  return { x: -offset.x, y: -offset.y, z: -offset.z };
}
