import type {
  ArmorPiece,
  Charm,
  CraftingMaterial,
  Decoration,
  Weapon,
} from "../../types";
import { pathStepMaterials, type WeaponPath } from "./weapon-paths";

export interface MaterialTotal {
  item: {
    id: string | number;
    /** Stable game-file identity used by bestiary/items/manifest.json. */
    gameId?: string | number;
    name: string;
    rarity?: number;
    icon?: {
      kind?: string;
      color?: string;
      colorId?: number;
    };
  };
  quantity: number;
  sources: string[];
}

export interface RequirementSource {
  label: string;
  kind: "weapon" | "armor" | "charm" | "decoration";
  materials?: CraftingMaterial[] | any[];
  zenny?: number;
  steps?: number;
}

export interface MaterialRequirements {
  materials: MaterialTotal[];
  zenny: number;
  steps: number;
  sources: RequirementSource[];
  untracked: { label: string; kind: RequirementSource["kind"]; reason: string }[];
}

function materialItem(material: any): MaterialTotal["item"] | null {
  const item = material?.item;
  if (!item || item.id == null) return null;
  return {
    id: item.id,
    gameId: item.gameId == null ? undefined : item.gameId,
    name: String(item.name || `#${item.id}`),
    rarity: typeof item.rarity === "number" ? item.rarity : undefined,
    icon: item.icon && typeof item.icon === "object"
      ? {
          kind: typeof item.icon.kind === "string" ? item.icon.kind : undefined,
          color: typeof item.icon.color === "string" ? item.icon.color : undefined,
          colorId: typeof item.icon.colorId === "number" ? item.icon.colorId : undefined,
        }
      : undefined,
  };
}

/** Aggregates sources without deduplicating work between equipment pieces. */
export function aggregateRequirements(
  sources: RequirementSource[],
): MaterialRequirements {
  const byItem = new Map<string, MaterialTotal>();
  const untracked: MaterialRequirements["untracked"] = [];
  let zenny = 0;
  let steps = 0;

  for (const source of sources) {
    const materials = Array.isArray(source.materials) ? source.materials : [];
    zenny += Number(source.zenny) || 0;
    steps += Number(source.steps) || 0;

    if (!materials.length && !source.zenny && source.kind === "decoration") {
      untracked.push({
        label: source.label,
        kind: source.kind,
        reason: "no-direct-crafting-recipe",
      });
    }

    for (const material of materials) {
      const item = materialItem(material);
      if (!item) continue;
      const quantity = Number(material.quantity) || 0;
      if (quantity <= 0) continue;
      const key = String(item.gameId ?? item.id);
      const existing = byItem.get(key);
      if (existing) {
        existing.quantity += quantity;
        if (!existing.sources.includes(source.label)) existing.sources.push(source.label);
      } else {
        byItem.set(key, { item, quantity, sources: [source.label] });
      }
    }
  }

  return {
    materials: [...byItem.values()].sort((a, b) =>
      a.item.name.localeCompare(b.item.name),
    ),
    zenny,
    steps,
    sources,
    untracked,
  };
}

function weaponDirectSource(weapon: Weapon): RequirementSource {
  const crafting = weapon.crafting;
  return {
    label: weapon.name,
    kind: "weapon",
    materials: crafting?.craftingMaterials || crafting?.materials || [],
    zenny: crafting?.craftingZennyCost ?? crafting?.zennyCost ?? 0,
    steps: 1,
  };
}

function armorSource(piece: ArmorPiece): RequirementSource {
  return {
    label: piece.name,
    kind: "armor",
    materials: piece.crafting?.materials || [],
    zenny: piece.crafting?.zennyCost ?? 0,
    steps: 1,
  };
}

function charmSource(charm: Charm): RequirementSource {
  return {
    label: charm.name,
    kind: "charm",
    materials: charm.crafting?.materials || [],
    zenny: charm.crafting?.zennyCost ?? 0,
    steps: 1,
  };
}

function decorationSource(decoration: Decoration): RequirementSource {
  return {
    label: decoration.name,
    kind: "decoration",
    materials: decoration.crafting?.materials || [],
    zenny: decoration.crafting?.zennyCost ?? 0,
    steps: 1,
  };
}

export interface LoadoutRequirementsInput {
  weapons?: (Weapon | null)[];
  weaponPaths?: (WeaponPath | null)[];
  armor?: (ArmorPiece | null)[];
  charm?: Charm | null;
  charms?: (Charm | null)[];
  decorations?: (Decoration | null)[];
}

/**
 * Builds the complete from-scratch shopping list for a loadout. A path is
 * attached by position to its weapon, so two weapons sharing ancestors still
 * contribute two independent crafting jobs.
 */
export function aggregateLoadoutRequirements(
  input: LoadoutRequirementsInput,
): MaterialRequirements {
  const sources: RequirementSource[] = [];
  const weapons = input.weapons || [];
  const paths = input.weaponPaths || [];

  weapons.forEach((weapon, index) => {
    if (!weapon) return;
    const path = paths[index];
    if (path) {
      const pathCost = pathStepMaterials(path);
      sources.push({
        label: `${weapon.name} · ${path.nodes[0]?.name || "base"}`,
        kind: "weapon",
        materials: pathCost.materials,
        zenny: pathCost.zenny,
        steps: pathCost.steps,
      });
    } else {
      sources.push(weaponDirectSource(weapon));
    }
  });

  for (const piece of input.armor || []) if (piece) sources.push(armorSource(piece));
  if (input.charm) sources.push(charmSource(input.charm));
  for (const charm of input.charms || []) {
    if (charm) sources.push(charmSource(charm));
  }
  for (const decoration of input.decorations || []) {
    if (decoration) sources.push(decorationSource(decoration));
  }

  return aggregateRequirements(sources);
}
