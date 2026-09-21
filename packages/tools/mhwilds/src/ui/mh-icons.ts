/**
 * Monster Hunter Wilds artwork used as icons throughout the tool surfaces.
 *
 * These are root-relative on purpose. Hosts resolve them at render time, so
 * the same catalogue works in the web app and in the desktop asset protocol.
 * Keep this separate from @boffmedia/ui's generic UI-glyph registry: these
 * files are extracted game artwork, not interchangeable interface icons.
 */

import { assetUrl, hasToolHost } from "@boffmedia/tool-kit";

export const MHWILDS_ICON_ROOT = "/boffmedia/img/games/mhwilds";
export const MHWILDS_TOOL_ICON_ROOT = "/boffmedia/tools/mhwilds/bestiary/item-icons";

const icon = (fileName: string) => `${MHWILDS_ICON_ROOT}/${fileName}`;
const toolIcon = (fileName: string) => `${MHWILDS_TOOL_ICON_ROOT}/${fileName}`;

export const MHWILDS_ICON_ASSETS = {
  game: icon("icon.webp"),
  tools: {
    planner: icon("long-sword.webp"),
    weaponTree: icon("charge-blade.webp"),
    armor: icon("chest.webp"),
    materials: toolIcon("plate-grey.svg"),
    bestiary: toolIcon("trap-grey.svg"),
  },
  weapons: {
    greatSword: icon("great-sword.webp"),
    longSword: icon("long-sword.webp"),
    swordShield: icon("sword-shield.webp"),
    dualBlades: icon("dual-blades.webp"),
    hammer: icon("hammer.webp"),
    huntingHorn: icon("hunting-horn.webp"),
    lance: icon("lance.webp"),
    gunlance: icon("gunlance.webp"),
    switchAxe: icon("switch-axe.webp"),
    chargeBlade: icon("charge-blade.webp"),
    insectGlaive: icon("insect-glaive.webp"),
    lightBowgun: icon("light-bowgun.webp"),
    heavyBowgun: icon("heavy-bowgun.webp"),
    bow: icon("bow.webp"),
  },
  armor: {
    head: icon("helmet.webp"),
    chest: icon("chest.webp"),
    arms: icon("gauntlets.webp"),
    waist: icon("waist.webp"),
    legs: icon("greaves.webp"),
  },
  attributes: {
    fire: icon("fire.webp"),
    water: icon("water.webp"),
    thunder: icon("thunder.webp"),
    ice: icon("ice.webp"),
    dragon: icon("dragon.webp"),
    poison: icon("poison.webp"),
    sleep: icon("sleep.webp"),
    paralysis: icon("paralysis.webp"),
    blast: icon("blast.webp"),
    stun: icon("stun.webp"),
  },
  charms: {
    1: icon("talisman-1.png"),
    2: icon("talisman-2.png"),
    3: icon("talisman-3.png"),
    4: icon("talisman-4.png"),
    5: icon("talisman-5.png"),
    6: icon("talisman-6.png"),
    7: icon("talisman-7.png"),
    8: icon("talisman-8.png"),
  },
  decorations: {
    1: icon("decoration-1.png"),
    2: icon("decoration-2.png"),
    3: icon("decoration-3.png"),
  },
} as const;

/** Resolve a legacy extracted icon filename for a tool host. */
export function mhwildsIconAsset(fileName: string): string {
  return resolveMhwildsIconAsset(
    `${MHWILDS_ICON_ROOT}/${fileName.replace(/^\/+/, "")}`,
  );
}

/** Resolve a catalogue path for direct `<img>` consumers inside a tool. */
export function resolveMhwildsIconAsset(path: string): string {
  return hasToolHost() ? assetUrl(path) : path;
}
