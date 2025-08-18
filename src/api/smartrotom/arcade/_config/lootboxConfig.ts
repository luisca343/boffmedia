import { ItemRarity } from "../entities/arcade-inventory.entity";

interface LootBoxItem {
  id: string;
  weight: number;
  type: string;
  data?: string;
}

export const rarityRanges = {
  common: { min: 50, max: 100 },
  uncommon: { min: 20, max: 49 },
  rare: { min: 10, max: 19 },
  epic: { min: 3, max: 9 },
  legendary: { min: 1, max: 2 }
};

// Helper function to determine rarity from weight
export function getRarityFromWeight(weight: number): ItemRarity {
  for (const [rarity, range] of Object.entries(rarityRanges)) {
    if (weight >= range.min && weight <= range.max) {
      return rarity as ItemRarity;
    }
  }
  return 'common';
}

interface LootBox {
  id: string;
  name: string;
  image: string;
  description: string;
  items: LootBoxItem[];
  theme: string;
}

export interface LootBoxConfig {
  boxes: LootBox[];
}

export const lootboxConfig: LootBoxConfig = {
  boxes: [
    {
      id: "trainer_box",
      name: "Caja de Entrenador",
      image: "/smartrotom/img/apps/arcade/lootbox/trainer_box.png",
      description: "Una caja básica con objetos esenciales para entrenadores principiantes.",
      items: [
        { id: "Blissey", weight: 90, type: "pokemon", data: "Blissey  lvl:33"  },
        { id: "pixelmon:potion", type: "item", weight: 90 },
        { id: "pixelmon:antidote", type: "item", weight: 85 },
        { id: "pixelmon:paralyze_heal", type: "item", weight: 80 },
        { id: "pixelmon:awakening", type: "item", weight: 80 },
        { id: "pixelmon:great_ball", type: "item", weight: 45 },
        { id: "pixelmon:super_potion", type: "item", weight: 40 },
        { id: "pixelmon:repel", type: "item", weight: 35 },
        { id: "pixelmon:escape_rope", type: "item", weight: 30 },
        { id: "pixelmon:ultra_ball", type: "item", weight: 18 },
        { id: "pixelmon:hyper_potion", type: "item", weight: 15 },
        { id: "pixelmon:revive", type: "item", weight: 12 },
        { id: "pixelmon:max_revive", type: "item", weight: 8 },
        { id: "pixelmon:max_potion", type: "item", weight: 6 },
        { id: "pixelmon:full_restore", type: "item", weight: 4 },
        { id: "pixelmon:master_ball", type: "item", weight: 2 },
        { id: "pixelmon:sacred_ash", type: "item", weight: 1 }
      ],
      theme: "blue"
    },
    {
      id: "evolution_box",
      name: "Caja de Evolución",
      image: "/smartrotom/img/apps/arcade/lootbox/evolution_box.png",
      description: "Contiene objetos que ayudan a tus Pokémon a evolucionar.",
      items: [
        { id: "leaf_stone", type: "item", weight: 100 },
        { id: "fire_stone", type: "item", weight: 90 },
        { id: "water_stone", type: "item", weight: 90 },
        { id: "thunder_stone", type: "item", weight: 80 },
        { id: "moon_stone", type: "item", weight: 45 },
        { id: "sun_stone", type: "item", weight: 40 },
        { id: "kings_rock", type: "item", weight: 35 },
        { id: "metal_coat", type: "item", weight: 18 },
        { id: "dragon_scale", type: "item", weight: 15 },
        { id: "upgrade", type: "item", weight: 12 },
        { id: "dawn_stone", type: "item", weight: 8 },
        { id: "dusk_stone", type: "item", weight: 6 },
        { id: "shiny_stone", type: "item", weight: 4 },
        { id: "dubious_disc", type: "item", weight: 2 },
        { id: "prism_scale", type: "item", weight: 1 }
      ],
      theme: "green"
    },
    {
      id: "battle_box",
      name: "Caja de Combate",
      image: "/smartrotom/img/apps/arcade/lootbox/battle_box.png",
      description: "Objetos avanzados para dar ventaja a tus Pokémon en combates competitivos.",
      items: [
        { id: "x_attack", type: "item", weight: 100 },
        { id: "x_defend", type: "item", weight: 95 },
        { id: "x_speed", type: "item", weight: 90 },
        { id: "x_accuracy", type: "item", weight: 85 },
        { id: "dire_hit", type: "item", weight: 45 },
        { id: "guard_spec", type: "item", weight: 40 },
        { id: "calcium", type: "item", weight: 35 },
        { id: "choice_band", type: "item", weight: 18 },
        { id: "leftovers", type: "item", weight: 16 },
        { id: "focus_sash", type: "item", weight: 14 },
        { id: "life_orb", type: "item", weight: 8 },
        { id: "assault_vest", type: "item", weight: 6 },
        { id: "mega_stone", type: "item", weight: 4 },
        { id: "z_crystal", type: "item", weight: 2 },
        { id: "dynamax_band", type: "item", weight: 1 }
      ],
      theme: "red"
    }
  ]
};