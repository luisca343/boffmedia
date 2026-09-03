/**
 * Sample teams, one per team format (D13).
 *
 * These exist so a team format is playable the moment someone picks it: the bot
 * needs a side, and a player who has built nothing yet has none to lend it. The
 * play screen prefers the player's OWN other team in that format and falls back
 * to these.
 *
 * EVERY ONE OF THESE IS VALIDATED, and not as a formality — writing plausible
 * competitive teams by hand produced two illegal ones on the first pass (a
 * level-50 VGC team offered as Doubles OU, an AG-tagged Miraidon in Ubers).
 * `samples.spec.ts` runs each through `TeamValidator` for its own format, so an
 * illegal sample fails the build rather than the battle.
 *
 * Inlined as string literals rather than read from the `.txt` files beside them:
 * this package is consumed as compiled CJS by apps/api and as ESM by two
 * bundlers, and none of those three can read a sibling file the same way. The
 * `.txt` originals are kept as the editable source and are what the spec reads.
 */

import { gen9ou } from "./gen9ou.js";
import { gen9ubers } from "./gen9ubers.js";
import { gen9monotype } from "./gen9monotype.js";
import { gen9doublesou } from "./gen9doublesou.js";
import { gen9vgc2025regi } from "./gen9vgc2025regi.js";
import { gen9nationaldex } from "./gen9nationaldex.js";

/** Showdown paste per format id. */
export const SAMPLE_TEAMS: Readonly<Record<string, string>> = {
  gen9ou,
  gen9ubers,
  gen9monotype,
  gen9doublesou,
  gen9vgc2025regi,
  gen9nationaldex,
};

/** The bundled team for a format, or null when none ships for it. */
export function sampleTeamFor(format: string): string | null {
  return SAMPLE_TEAMS[format] ?? null;
}
