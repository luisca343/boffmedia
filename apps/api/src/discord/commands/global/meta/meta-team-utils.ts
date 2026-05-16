import { VgcMetaSlot } from '@/_db/schema/Vgc';

// Defensive type chart: DEFENSE_CHART[defType][atkType] = effectiveness multiplier.
// Only non-1x values stored; missing key = 1x.
const DEFENSE_CHART: Record<string, Record<string, number>> = {
  normal: { fighting: 2, ghost: 0 },
  fire: {
    water: 2,
    rock: 2,
    ground: 2,
    fire: 0.5,
    grass: 0.5,
    ice: 0.5,
    bug: 0.5,
    steel: 0.5,
    fairy: 0.5,
  },
  water: { electric: 2, grass: 2, water: 0.5, ice: 0.5, fire: 0.5, steel: 0.5 },
  electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
  grass: {
    fire: 2,
    ice: 2,
    poison: 2,
    flying: 2,
    bug: 2,
    water: 0.5,
    electric: 0.5,
    grass: 0.5,
    ground: 0.5,
  },
  ice: { fire: 2, fighting: 2, rock: 2, steel: 2, water: 0.5, ice: 0.5 },
  fighting: { flying: 2, psychic: 2, fairy: 2, rock: 0.5, bug: 0.5, dark: 0.5 },
  poison: {
    ground: 2,
    psychic: 2,
    fighting: 0.5,
    poison: 0.5,
    bug: 0.5,
    grass: 0.5,
    fairy: 0.5,
  },
  ground: { water: 2, grass: 2, ice: 2, electric: 0, poison: 0.5, rock: 0.5 },
  flying: {
    electric: 2,
    ice: 2,
    rock: 2,
    ground: 0,
    fighting: 0.5,
    bug: 0.5,
    grass: 0.5,
  },
  psychic: { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
  bug: { fire: 2, flying: 2, rock: 2, fighting: 0.5, ground: 0.5, grass: 0.5 },
  rock: {
    water: 2,
    grass: 2,
    fighting: 2,
    ground: 2,
    steel: 2,
    normal: 0.5,
    fire: 0.5,
    poison: 0.5,
    flying: 0.5,
  },
  ghost: { ghost: 2, dark: 2, normal: 0, fighting: 0, poison: 0.5, bug: 0.5 },
  dragon: {
    ice: 2,
    dragon: 2,
    fairy: 2,
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    grass: 0.5,
  },
  dark: { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
  steel: {
    fire: 2,
    fighting: 2,
    ground: 2,
    normal: 0.5,
    grass: 0.5,
    ice: 0.5,
    flying: 0.5,
    rock: 0.5,
    bug: 0.5,
    steel: 0.5,
    dragon: 0.5,
    fairy: 0.5,
    psychic: 0.5,
    water: 0.5,
    electric: 0.5,
    poison: 0,
  },
  fairy: { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 },
};

export const ALL_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

export type AttackingType = (typeof ALL_TYPES)[number];

export function getEffectiveness(atkType: string, defTypes: string[]): number {
  let mult = 1;
  for (const dt of defTypes) {
    const row = DEFENSE_CHART[dt.toLowerCase()];
    if (row) mult *= row[atkType.toLowerCase()] ?? 1;
  }
  return mult;
}

export interface WeaknessResult {
  atkType: string;
  doubleHits: number;
  quadHits: number;
  total: number;
}

export function analyzeWeaknesses(
  team: Array<{ speciesName: string; types: string[] }>,
): WeaknessResult[] {
  const results: WeaknessResult[] = [];
  for (const atkType of ALL_TYPES) {
    let doubleHits = 0;
    let quadHits = 0;
    for (const mon of team) {
      const e = getEffectiveness(atkType, mon.types);
      if (e >= 4) quadHits++;
      else if (e >= 2) doubleHits++;
    }
    if (doubleHits + quadHits === 0) continue;
    results.push({
      atkType,
      doubleHits,
      quadHits,
      total: doubleHits + quadHits * 2,
    });
  }
  return results.sort((a, b) => b.total - a.total);
}

const WEATHER_ABILITIES: Record<string, string> = {
  drizzle: 'rain',
  'primordial sea': 'rain',
  drought: 'sun',
  'desolate land': 'sun',
  'sand stream': 'sand',
  'snow warning': 'snow',
};

const WEATHER_MOVES: Record<string, string> = {
  'rain dance': 'rain',
  'sunny day': 'sun',
  sandstorm: 'sand',
  snowscape: 'snow',
};

const HO_ITEMS = new Set([
  'choice scarf',
  'choice band',
  'choice specs',
  'life orb',
  'booster energy',
]);

export function detectArchetype(slots: VgcMetaSlot[]): string[] {
  const archetypes = new Set<string>();
  const allMoves = slots.flatMap((s) => s.moves.map((m) => m.toLowerCase()));
  const allAbilities = slots.map((s) => (s.ability ?? '').toLowerCase());
  const allItems = slots.map((s) => (s.item ?? '').toLowerCase());

  if (allMoves.includes('trick room')) archetypes.add('Trick Room');
  if (allMoves.includes('tailwind')) archetypes.add('Tailwind');

  for (const ab of allAbilities) {
    const w = WEATHER_ABILITIES[ab];
    if (w === 'rain') archetypes.add('Rain');
    if (w === 'sun') archetypes.add('Sun');
    if (w === 'sand') archetypes.add('Sand');
    if (w === 'snow') archetypes.add('Snow');
  }
  for (const m of allMoves) {
    const w = WEATHER_MOVES[m];
    if (w === 'rain') archetypes.add('Rain');
    if (w === 'sun') archetypes.add('Sun');
    if (w === 'sand') archetypes.add('Sand');
    if (w === 'snow') archetypes.add('Snow');
  }

  const psyMoves = new Set(['expanding force', 'future sight']);
  const psyCount = slots.filter((s) =>
    s.moves.some((m) => psyMoves.has(m.toLowerCase())),
  ).length;
  if (psyCount >= 2) archetypes.add('Psyspam');

  const hoCount = allItems.filter((it) => HO_ITEMS.has(it)).length;
  if (hoCount >= 4) archetypes.add('Hyper Offense');

  if (archetypes.size === 0) archetypes.add('Balance');
  return [...archetypes];
}

const ROLE_MOVES: Record<string, string[]> = {
  'Speed Control': [
    'trick room',
    'tailwind',
    'electroweb',
    'icy wind',
    'scary face',
    'bulldoze',
  ],
  'Fake Out': ['fake out'],
  Redirection: ['follow me', 'rage powder'],
  'Wide Guard': ['wide guard'],
  Encore: ['encore'],
};

export interface RoleAnalysis {
  present: string[];
  missing: string[];
}

export function analyzeRoles(slots: VgcMetaSlot[]): RoleAnalysis {
  const allMoves = slots.flatMap((s) => s.moves.map((m) => m.toLowerCase()));
  const allAbilities = slots.map((s) => (s.ability ?? '').toLowerCase());

  const present: string[] = [];
  const allRoleKeys = [...Object.keys(ROLE_MOVES), 'Intimidate'];

  for (const role of allRoleKeys) {
    if (role === 'Intimidate') {
      if (allAbilities.includes('intimidate')) present.push('Intimidate');
    } else {
      const moveset = ROLE_MOVES[role];
      if (allMoves.some((m) => moveset.includes(m))) present.push(role);
    }
  }

  const missing = allRoleKeys.filter((r) => !present.includes(r));
  return { present, missing };
}
