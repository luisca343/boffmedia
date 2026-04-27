export interface MovesetEntry { name: string; percent: number; }
export interface SpreadEntry  { nature: string; spread: string; percent: number; }

export interface MovesetPokemon {
  speciesName: string;
  abilities:   MovesetEntry[];
  items:       MovesetEntry[];
  moves:       MovesetEntry[];
  teraTypes:   MovesetEntry[];
  teammates:   MovesetEntry[];
  spreads:     SpreadEntry[];
}

const KNOWN_SECTIONS = new Set([
  'Abilities', 'Items', 'Spreads', 'Moves', 'Tera Types', 'Teammates',
]);

/**
 * Parses a Smogon moveset.txt file.
 * Returns a map keyed by the display name as it appears in the file ("Incineroar", "Calyrex-Shadow").
 *
 * Structure: blocks separated by +---+ lines. First block = Pokémon name.
 * Subsequent blocks alternate between metadata (Raw count / Avg. weight) and named sections.
 */
export function parseMovesetTxt(text: string): Record<string, MovesetPokemon> {
  const result: Record<string, MovesetPokemon> = {};

  // Split on separator lines (+----...----+), strip the | borders from content lines
  const chunks = text
    .split(/\+-+\+/)
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.replace(/^\s*\|\s*|\s*\|\s*$/g, '').trim())
        .filter(Boolean),
    )
    .filter((chunk) => chunk.length > 0);

  let current: MovesetPokemon | null = null;

  for (const chunk of chunks) {
    const first = chunk[0];

    if (KNOWN_SECTIONS.has(first)) {
      if (!current) continue;
      for (let i = 1; i < chunk.length; i++) {
        parseEntry(chunk[i], first, current);
      }
    } else if (chunk.length === 1 && !first.includes(':') && !first.includes('%')) {
      // Single non-metadata line → Pokémon display name
      current = {
        speciesName: first,
        abilities: [], items: [], moves: [], teraTypes: [], teammates: [], spreads: [],
      };
      result[first] = current;
    }
    // else: metadata block (Raw count: / Avg. weight: / Viability Ceiling:) — skip
  }

  return result;
}

function parseEntry(line: string, section: string, pokemon: MovesetPokemon): void {
  const match = line.match(/^(.+?)\s+([\d.]+)%\s*$/);
  if (!match) return;

  const name    = match[1].trim();
  const percent = parseFloat(match[2]);

  switch (section) {
    case 'Abilities':  pokemon.abilities.push({ name, percent });  break;
    case 'Items':      pokemon.items.push({ name, percent });      break;
    case 'Moves':      pokemon.moves.push({ name, percent });      break;
    case 'Tera Types': pokemon.teraTypes.push({ name, percent });  break;
    case 'Teammates':  pokemon.teammates.push({ name, percent });  break;
    case 'Spreads': {
      const colonIdx = name.indexOf(':');
      if (colonIdx === -1) return;
      pokemon.spreads.push({
        nature:  name.slice(0, colonIdx),
        spread:  name.slice(colonIdx + 1),
        percent,
      });
      break;
    }
  }
}
