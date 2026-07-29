/**
 * Which 1.12 LittleTiles structure types the converter can carry to 1.21 with
 * behaviour intact, and the modern registry data needed to write them.
 *
 * Derived from the modern mod's own 1.12 converter
 * (OldLittleTilesDataParser.java, LittleTiles branch 1.21) — mirroring it keeps
 * us load-compatible by definition. The modern registry has NO default entry:
 * an unknown `structure.id` NPEs the game on load, so anything outside this map
 * must be flattened to plain tiles, never written through.
 */

/** 1.12 registry id → modern (1.21) registry id. */
export const LT_STRUCTURE_ID_MAP: Record<string, string> = {
  // Doors — three of the four renamed, and modern `door` is NOT 1.12 `door`:
  // 1.12 `door` is the axis door; modern `door` is the 1.12 advancedDoor.
  door: "axis",
  slidingDoor: "sliding",
  advancedDoor: "door",
  doorActivator: "activator",
  fixed: "fixed",
  ladder: "ladder",
  bed: "bed",
  chair: "chair",
  storage: "storage",
  noclip: "noclip",
  light: "light",
  message: "message",
  item_holder: "item_holder",
  workbench: "workbench",
  importer: "importer",
  exporter: "exporter",
  particle_emitter: "particle_emitter",
  blankomatic: "blankomatic",
  structure_builder: "structure_builder",
  // Signal-network premades keep their ids; converted base-only (their input
  // state resets to defaults — the components re-settle once powered).
  single_cable1: "single_cable1",
  single_cable4: "single_cable4",
  single_cable16: "single_cable16",
  single_input1: "single_input1",
  single_input4: "single_input4",
  single_input16: "single_input16",
  single_output1: "single_output1",
  single_output4: "single_output4",
  single_output16: "single_output16",
  signal_display_16: "signal_display_16",
};

/**
 * Modern structure attribute bitmask per modern id (LittleStructureAttribute —
 * bit-identical across generations). Written as every `children[]` entry's
 * `type` int when the 1.12 source didn't carry one.
 */
export const LT_STRUCTURE_ATTRIBUTES: Record<string, number> = {
  ladder: 1, // LADDER
  workbench: 4, // PREMADE
  importer: 4,
  exporter: 4,
  particle_emitter: 4,
  blankomatic: 4,
  structure_builder: 4,
  item_holder: 0x200, // EXTRA_RENDERING
  light: 0x40000, // LIGHT_EMITTER
  noclip: 0x20002, // NOCOLLISION | COLLISION_LISTENER
  single_cable1: 4,
  single_cable4: 4,
  single_cable16: 4,
  single_input1: 4,
  single_input4: 4,
  single_input16: 4,
  single_output1: 4,
  single_output4: 4,
  single_output16: 4,
  signal_display_16: 4,
};

/**
 * Types whose field conversion isn't implemented yet even though a modern
 * counterpart exists (their 1.12 payload needs a timeline rewrite we don't do).
 */
export const LT_STRUCTURE_UNSUPPORTED = new Set(["advancedDoor", "doorActivator"]);

export type LtStructureSupport = "behavior" | "flatten-unsupported" | "flatten-unknown";

/**
 * What the converter will do with a structure of this 1.12 type: carry it as a
 * real modern structure ("behavior"), or flatten its geometry to plain tiles.
 * Orphan/cut instances flatten regardless of their type's verdict.
 */
export function structureSupport(type: string): LtStructureSupport {
  if (LT_STRUCTURE_UNSUPPORTED.has(type)) return "flatten-unsupported";
  return LT_STRUCTURE_ID_MAP[type] ? "behavior" : "flatten-unknown";
}
