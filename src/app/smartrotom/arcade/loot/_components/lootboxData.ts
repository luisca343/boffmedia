import { LootBox, Item } from "./types";

// Pokemon-themed items
const pokemonItems: Item[] = [
  // Common items (60%)
  {
    id: "pixelmon.poke_ball",
    name: "Poké Ball",
    image: "/smartrotom/img/apps/arcade/lootbox/items/pokeball.png",
    rarity: "common",
    description: "Una ball básica para atrapar Pokémon."
  },
  {
    id: "pixelmon.potion",
    name: "Poción",
    image: "/smartrotom/img/apps/arcade/lootbox/items/potion.png",
    rarity: "common",
    description: "Restaura 20 PS de un Pokémon."
  },
  {
    id: "pixelmon.antidote",
    name: "Antídoto",
    image: "/smartrotom/img/apps/arcade/lootbox/items/antidote.png",
    rarity: "common",
    description: "Cura el envenenamiento de un Pokémon."
  },
  {
    id: "pixelmon.paralyze_heal",
    name: "Antiparaliz",
    image: "/smartrotom/img/apps/arcade/lootbox/items/paralyze-heal.png",
    rarity: "common",
    description: "Cura la parálisis de un Pokémon."
  },
  {
    id: "pixelmon.awakening",
    name: "Despertar",
    image: "/smartrotom/img/apps/arcade/lootbox/items/awakening.png",
    rarity: "common",
    description: "Despierta a un Pokémon dormido."
  },
  
  // Uncommon items (25%)
  {
    id: "pixelmon.great_ball",
    name: "Super Ball",
    image: "/smartrotom/img/apps/arcade/lootbox/items/great-ball.png",
    rarity: "uncommon",
    description: "Una ball con mayor ratio de captura que una Poké Ball."
  },
  {
    id: "pixelmon.super_potion",
    name: "Súper Poción",
    image: "/smartrotom/img/apps/arcade/lootbox/items/super-potion.png",
    rarity: "uncommon",
    description: "Restaura 50 PS de un Pokémon."
  },
  {
    id: "pixelmon.repel",
    name: "Repelente",
    image: "/smartrotom/img/apps/arcade/lootbox/items/repel.png",
    rarity: "uncommon",
    description: "Mantiene alejados a los Pokémon salvajes por 100 pasos."
  },
  {
    id: "pixelmon.escape_rope",
    name: "Cuerda Huida",
    image: "/smartrotom/img/apps/arcade/lootbox/items/escape-rope.png",
    rarity: "uncommon",
    description: "Te permite salir rápidamente de una cueva o mazmorra."
  },
  
  // Rare items (10%)
  {
    id: "pixelmon._ultra_ball",
    name: "Ultra Ball",
    image: "/smartrotom/img/apps/arcade/lootbox/items/ultra-ball.png",
    rarity: "rare",
    description: "Una ball con excelente ratio de captura."
  },
  {
    id: "pixelmon.hyper_potion",
    name: "Híper Poción",
    image: "/smartrotom/img/apps/arcade/lootbox/items/hyper-potion.png",
    rarity: "rare",
    description: "Restaura 200 PS de un Pokémon."
  },
  {
    id: "pixelmon.revive",
    name: "Revivir",
    image: "/smartrotom/img/apps/arcade/lootbox/items/revive.png",
    rarity: "rare",
    description: "Revive a un Pokémon debilitado con la mitad de sus PS."
  },
  
  // Epic items (4%)
  {
    id: "pixelmon.max_revive",
    name: "Revivir Máximo",
    image: "/smartrotom/img/apps/arcade/lootbox/items/max-revive.png",
    rarity: "epic",
    description: "Revive a un Pokémon debilitado con todos sus PS."
  },
  {
    id: "pixelmon.max_potion",
    name: "Máx. Poción",
    image: "/smartrotom/img/apps/arcade/lootbox/items/max-potion.png",
    rarity: "epic",
    description: "Restaura completamente los PS de un Pokémon."
  },
  {
    id: "pixelmon.full_restore",
    name: "Restaurar Todo",
    image: "/smartrotom/img/apps/arcade/lootbox/items/full-restore.png",
    rarity: "epic",
    description: "Restaura completamente los PS y cura todos los problemas de estado."
  },
  
  // Legendary items (1%)
  {
    id: "pixelmon.master_ball",
    name: "Master Ball",
    image: "/smartrotom/img/apps/arcade/lootbox/items/master-ball.png",
    rarity: "legendary",
    description: "La ball definitiva. Captura cualquier Pokémon sin fallar."
  },
  {
    id: "pixelmon.sacred_ash",
    name: "Ceniza Sagrada",
    image: "/smartrotom/img/apps/arcade/lootbox/items/sacred-ash.png",
    rarity: "legendary",
    description: "Revive a todos los Pokémon debilitados con todos sus PS."
  }
];

// Evolution-themed items
const evolutionItems: Item[] = [
  // Common items
  {
    id: "leaf-stone",
    name: "Piedra Hoja",
    image: "/smartrotom/img/apps/arcade/lootbox/items/leaf-stone.png",
    rarity: "common",
    description: "Hace evolucionar a ciertos Pokémon de tipo Planta."
  },
  {
    id: "fire-stone",
    name: "Piedra Fuego",
    image: "/smartrotom/img/apps/arcade/lootbox/items/fire-stone.png",
    rarity: "common",
    description: "Hace evolucionar a ciertos Pokémon de tipo Fuego."
  },
  {
    id: "water-stone",
    name: "Piedra Agua",
    image: "/smartrotom/img/apps/arcade/lootbox/items/water-stone.png",
    rarity: "common",
    description: "Hace evolucionar a ciertos Pokémon de tipo Agua."
  },
  {
    id: "thunder-stone",
    name: "Piedra Trueno",
    image: "/smartrotom/img/apps/arcade/lootbox/items/thunder-stone.png",
    rarity: "common",
    description: "Hace evolucionar a ciertos Pokémon de tipo Eléctrico."
  },
  
  // Uncommon items
  {
    id: "moon-stone",
    name: "Piedra Lunar",
    image: "/smartrotom/img/apps/arcade/lootbox/items/moon-stone.png",
    rarity: "uncommon",
    description: "Hace evolucionar a ciertos Pokémon asociados con la luna."
  },
  {
    id: "sun-stone",
    name: "Piedra Solar",
    image: "/smartrotom/img/apps/arcade/lootbox/items/sun-stone.png",
    rarity: "uncommon",
    description: "Hace evolucionar a ciertos Pokémon asociados con el sol."
  },
  {
    id: "kings-rock",
    name: "Roca del Rey",
    image: "/smartrotom/img/apps/arcade/lootbox/items/kings-rock.png",
    rarity: "uncommon",
    description: "Permite la evolución de Politoed y Slowking al intercambiarlos."
  },
  
  // Rare items
  {
    id: "metal-coat",
    name: "Revestimiento Metálico",
    image: "/smartrotom/img/apps/arcade/lootbox/items/metal-coat.png",
    rarity: "rare",
    description: "Permite la evolución de Scyther y Onix al intercambiarlos."
  },
  {
    id: "dragon-scale",
    name: "Escama Dragón",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dragon-scale.png",
    rarity: "rare",
    description: "Permite la evolución de Seadra al intercambiarlo."
  },
  {
    id: "upgrade",
    name: "Mejora",
    image: "/smartrotom/img/apps/arcade/lootbox/items/upgrade.png",
    rarity: "rare",
    description: "Permite la evolución de Porygon al intercambiarlo."
  },
  
  // Epic items
  {
    id: "dawn-stone",
    name: "Piedra Alba",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dawn-stone.png",
    rarity: "epic",
    description: "Hace evolucionar a Kirlia macho a Gallade y a Snorunt hembra a Froslass."
  },
  {
    id: "dusk-stone",
    name: "Piedra Noche",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dusk-stone.png",
    rarity: "epic",
    description: "Hace evolucionar a ciertos Pokémon asociados con la oscuridad."
  },
  {
    id: "shiny-stone",
    name: "Piedra Brillante",
    image: "/smartrotom/img/apps/arcade/lootbox/items/shiny-stone.png",
    rarity: "epic",
    description: "Hace evolucionar a ciertos Pokémon asociados con la luz."
  },
  
  // Legendary items
  {
    id: "dubious-disc",
    name: "Disco Extraño",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dubious-disc.png",
    rarity: "legendary",
    description: "Permite la evolución de Porygon2 al intercambiarlo."
  },
  {
    id: "prism-scale",
    name: "Escama Bella",
    image: "/smartrotom/img/apps/arcade/lootbox/items/prism-scale.png",
    rarity: "legendary",
    description: "Permite la evolución de Feebas a Milotic."
  }
];

// Battle-themed items
const battleItems: Item[] = [
  // Common items
  {
    id: "x-attack",
    name: "Ataque X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/x-attack.png",
    rarity: "common",
    description: "Aumenta el Ataque durante el combate."
  },
  {
    id: "x-defend",
    name: "Defensa X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/x-defend.png",
    rarity: "common",
    description: "Aumenta la Defensa durante el combate."
  },
  {
    id: "x-speed",
    name: "Velocidad X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/x-speed.png",
    rarity: "common",
    description: "Aumenta la Velocidad durante el combate."
  },
  {
    id: "x-accuracy",
    name: "Precisión X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/x-accuracy.png",
    rarity: "common",
    description: "Aumenta la Precisión durante el combate."
  },
  
  // Uncommon items
  {
    id: "dire-hit",
    name: "Crítico X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dire-hit.png",
    rarity: "uncommon",
    description: "Aumenta la probabilidad de golpe crítico durante el combate."
  },
  {
    id: "guard-spec",
    name: "Protección X",
    image: "/smartrotom/img/apps/arcade/lootbox/items/guard-spec.png",
    rarity: "uncommon",
    description: "Previene la reducción de estadísticas durante cinco turnos."
  },
  {
    id: "calcium",
    name: "Calcio",
    image: "/smartrotom/img/apps/arcade/lootbox/items/calcium.png",
    rarity: "uncommon",
    description: "Aumenta el Ataque Especial base de un Pokémon."
  },
  
  // Rare items
  {
    id: "choice-band",
    name: "Cinta Elegida",
    image: "/smartrotom/img/apps/arcade/lootbox/items/choice-band.png",
    rarity: "rare",
    description: "Aumenta el Ataque un 50%, pero solo permite usar un movimiento."
  },
  {
    id: "leftovers",
    name: "Restos",
    image: "/smartrotom/img/apps/arcade/lootbox/items/leftovers.png",
    rarity: "rare",
    description: "Restaura PS gradualmente durante el combate."
  },
  {
    id: "focus-sash",
    name: "Banda Focus",
    image: "/smartrotom/img/apps/arcade/lootbox/items/focus-sash.png",
    rarity: "rare",
    description: "Permite sobrevivir con 1 PS a un ataque que causaría KO, si estaba a PS completos."
  },
  
  // Epic items
  {
    id: "life-orb",
    name: "Orbe Vida",
    image: "/smartrotom/img/apps/arcade/lootbox/items/life-orb.png",
    rarity: "epic",
    description: "Aumenta la potencia de los ataques un 30%, pero el usuario pierde 10% de sus PS máximos."
  },
  {
    id: "assault-vest",
    name: "Chaleco Asalto",
    image: "/smartrotom/img/apps/arcade/lootbox/items/assault-vest.png",
    rarity: "epic",
    description: "Aumenta la Defensa Especial un 50%, pero impide usar movimientos de estado."
  },
  {
    id: "mega-stone",
    name: "Piedra Mega",
    image: "/smartrotom/img/apps/arcade/lootbox/items/mega-stone.png",
    rarity: "epic",
    description: "Permite a ciertos Pokémon megaevolucionar durante el combate."
  },
  
  // Legendary items
  {
    id: "z-crystal",
    name: "Cristal Z",
    image: "/smartrotom/img/apps/arcade/lootbox/items/z-crystal.png",
    rarity: "legendary",
    description: "Permite a un Pokémon usar un movimiento Z una vez por combate."
  },
  {
    id: "dynamax-band",
    name: "Pulsera Dinamax",
    image: "/smartrotom/img/apps/arcade/lootbox/items/dynamax-band.png",
    rarity: "legendary",
    description: "Permite a un Pokémon Dinamaxizarse durante el combate."
  }
];

// Define available lootboxes
export const availableLootBoxes: LootBox[] = [
  {
    id: "trainer-box",
    name: "Caja de Entrenador",
    image: "/smartrotom/img/apps/arcade/lootbox/trainer-box.png",
    price: 200,
    description: "Una caja básica con objetos esenciales para entrenadores principiantes.",
    items: pokemonItems,
    theme: "blue"
  },
  
  {
    id: "evolution-box",
    name: "Caja de Evolución",
    image: "/smartrotom/img/apps/arcade/lootbox/evolution-box.png",
    price: 500,
    description: "Contiene objetos que ayudan a tus Pokémon a evolucionar.",
    items: evolutionItems,
    theme: "green"
  },
  {
    id: "battle-box",
    name: "Caja de Combate",
    image: "/smartrotom/img/apps/arcade/lootbox/battle-box.png",
    price: 800,
    description: "Objetos avanzados para dar ventaja a tus Pokémon en combates competitivos.",
    items: battleItems,
    theme: "red"
  }
];