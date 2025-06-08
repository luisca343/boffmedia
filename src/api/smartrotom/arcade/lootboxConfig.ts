interface LootBoxItem {
  id: string;
  weight: number;
}

export const rarityRanges = {
  common: { min: 50, max: 100 },
  uncommon: { min: 20, max: 49 },
  rare: { min: 10, max: 19 },
  epic: { min: 3, max: 9 },
  legendary: { min: 1, max: 2 }
};

// Helper function to determine rarity from weight
export function getRarityFromWeight(weight: number): string {
  for (const [rarity, range] of Object.entries(rarityRanges)) {
    if (weight >= range.min && weight <= range.max) {
      return rarity;
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

interface LootBoxConfig {
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
        { id: "pixelmon:poke_ball", weight: 90 },
        { id: "pixelmon:potion", weight: 90 },
        { id: "pixelmon:antidote", weight: 85 },
        { id: "pixelmon:paralyze_heal", weight: 80 },
        { id: "pixelmon:awakening", weight: 80 },
        { id: "pixelmon:great_ball", weight: 45 },
        { id: "pixelmon:super_potion", weight: 40 },
        { id: "pixelmon:repel", weight: 35 },
        { id: "pixelmon:escape_rope", weight: 30 },
        { id: "pixelmon:ultra_ball", weight: 18 },
        { id: "pixelmon:hyper_potion", weight: 15 },
        { id: "pixelmon:revive", weight: 12 },
        { id: "pixelmon:max_revive", weight: 8 },
        { id: "pixelmon:max_potion", weight: 6 },
        { id: "pixelmon:full_restore", weight: 4 },
        { id: "pixelmon:master_ball", weight: 2 },
        { id: "pixelmon:sacred_ash", weight: 1 }
      ],
      theme: "blue"
    },
    {
      id: "evolution_box",
      name: "Caja de Evolución",
      image: "/smartrotom/img/apps/arcade/lootbox/evolution_box.png",
      description: "Contiene objetos que ayudan a tus Pokémon a evolucionar.",
      items: [
        { id: "leaf_stone", weight: 100 },
        { id: "fire_stone", weight: 90 },
        { id: "water_stone", weight: 90 },
        { id: "thunder_stone", weight: 80 },
        { id: "moon_stone", weight: 45 },
        { id: "sun_stone", weight: 40 },
        { id: "kings_rock", weight: 35 },
        { id: "metal_coat", weight: 18 },
        { id: "dragon_scale", weight: 15 },
        { id: "upgrade", weight: 12 },
        { id: "dawn_stone", weight: 8 },
        { id: "dusk_stone", weight: 6 },
        { id: "shiny_stone", weight: 4 },
        { id: "dubious_disc", weight: 2 },
        { id: "prism_scale", weight: 1 }
      ],
      theme: "green"
    },
    {
      id: "battle_box",
      name: "Caja de Combate",
      image: "/smartrotom/img/apps/arcade/lootbox/battle_box.png",
      description: "Objetos avanzados para dar ventaja a tus Pokémon en combates competitivos.",
      items: [
        { id: "x_attack", weight: 100 },
        { id: "x_defend", weight: 95 },
        { id: "x_speed", weight: 90 },
        { id: "x_accuracy", weight: 85 },
        { id: "dire_hit", weight: 45 },
        { id: "guard_spec", weight: 40 },
        { id: "calcium", weight: 35 },
        { id: "choice_band", weight: 18 },
        { id: "leftovers", weight: 16 },
        { id: "focus_sash", weight: 14 },
        { id: "life_orb", weight: 8 },
        { id: "assault_vest", weight: 6 },
        { id: "mega_stone", weight: 4 },
        { id: "z_crystal", weight: 2 },
        { id: "dynamax_band", weight: 1 }
      ],
      theme: "red"
    }
  ]
};