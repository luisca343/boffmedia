/**
 * Tab registry for Randomizer editor.
 *
 * Each tab wires its FVX §6 controls to the shared RandomizerSettings form via useFormContext.
 * Control→field mapping (incl. inverted booleans + radio→enum collapse) is authoritative in
 * FVX RandomizerGUI.java; field names+enums in settings-fields.json.
 *
 * Tabs are built independently (parallel, no shared-file conflicts).
 */

import TraitsTab from "./traits"
import StartersTab from "./starters"
import MovesTab from "./moves"
import FoesTab from "./foes"
import WildTab from "./wild"
import TmhmTab from "./tmhm"
import ItemsTab from "./items"
import TypesTab from "./types"
import GraphicsTab from "./graphics"
import MiscTab from "./misc"

export const TAB_REGISTRY = {
  traits: TraitsTab,
  starters: StartersTab,
  moves: MovesTab,
  foes: FoesTab,
  wild: WildTab,
  tmhm: TmhmTab,
  items: ItemsTab,
  types: TypesTab,
  graphics: GraphicsTab,
  misc: MiscTab,
} as const

export const TAB_KEYS = Object.keys(TAB_REGISTRY) as Array<keyof typeof TAB_REGISTRY>
