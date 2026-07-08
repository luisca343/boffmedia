import { Pokemon } from "@pkmn/client";
import { Dex } from "@pkmn/dex";

type BSXMon = {
  id: string; name: string; types: string[]; hp: number; fnt?: boolean; tera?: boolean;
  teraType?: string; status?: string | null; boosts?: Record<string, number>;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves?: any[]; sleepT?: number; protect?: boolean;
};

type BSXKeyMove = {
  name: string; type: string; cat: string; power: number;
  acc: number | null; pp: number; maxpp: number;
  prio?: number; spread?: string; effect?: string;
};

type BSXTickEv = {
  turn?: number; kind?: string; who?: string;
  type?: string; crit?: boolean; txt?: string;
  dmg?: string; eff?: string; boost?: string;
};

type TeamMemberHP = { hp: number; fnt?: boolean; name?: string; unknown?: boolean };

export function toBSXMon(pokemon: Pokemon | null): BSXMon | null {
  if (!pokemon) return null;
  const species = pokemon.species;
  const stats = species?.baseStats || { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const hpPct = pokemon.maxhp > 0 ? Math.floor((pokemon.hp / pokemon.maxhp) * 100) : 100;
  return {
    id: pokemon.speciesForme?.toLowerCase() || pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: pokemon.name,
    types: [...pokemon.types] as string[],
    hp: Math.max(0, Math.min(100, hpPct)),
    fnt: pokemon.hp <= 0,
    tera: !!pokemon.terastallized,
    teraType: pokemon.terastallized,
    status: pokemon.status || null,
    boosts: { ...(pokemon.boosts as Record<string, number>) },
    stats: {
      hp: stats.hp, atk: stats.atk, def: stats.def,
      spa: stats.spa, spd: stats.spd, spe: stats.spe,
    },
    protect: !!pokemon.volatiles?.protect,
  };
}

export function toBSXKeyMoves(
  moves: Array<{ name?: string; id: string; pp: number; maxpp: number; target?: string; disabled?: boolean }> | undefined
): BSXKeyMove[] {
  if (!moves) return [];
  return moves.map((m) => {
    const dexMove = Dex.moves.get(m.id);
    if (!dexMove?.exists) {
      return { name: m.name || m.id, type: "Normal", cat: "status", power: 0, acc: null, pp: m.pp, maxpp: m.maxpp };
    }
    const catMap: Record<string, string> = { Physical: "phys", Special: "spec", Status: "status" };
    return {
      name: dexMove.name,
      type: dexMove.type,
      cat: catMap[dexMove.category] || "status",
      power: dexMove.basePower,
      acc: dexMove.accuracy === true ? null : dexMove.accuracy,
      pp: m.pp,
      maxpp: m.maxpp,
    };
  });
}

export function requestPokemonToBSXMon(
  poke: { ident: string; condition: string; active?: boolean; stats?: any; details?: string }
): BSXMon {
  const speciesName = poke.ident?.split(": ")[1] || "Unknown";
  const species = Dex.species.get(speciesName);
  const stats = species?.exists
    ? { hp: species.baseStats.hp, atk: species.baseStats.atk, def: species.baseStats.def, spa: species.baseStats.spa, spd: species.baseStats.spd, spe: species.baseStats.spe }
    : { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const isFnt = poke.condition?.includes("fnt");
  const hpMatch = poke.condition?.match(/^(\d+)\/(\d+)/);
  const hpPct = hpMatch ? Math.floor((parseInt(hpMatch[1]) / parseInt(hpMatch[2])) * 100) : (isFnt ? 0 : 100);
  const statusMatch = poke.condition?.match(/ ([a-z]{3})$/);
  const status = isFnt ? "fnt" : statusMatch?.[1] || null;
  return {
    id: speciesName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: speciesName,
    types: species?.exists ? [...species.types] : ["Normal"],
    hp: Math.max(0, Math.min(100, hpPct)),
    fnt: !!isFnt,
    status,
    stats,
  };
}

export function toBSXTicks(htmlLines: string[]): BSXTickEv[] {
  const result: BSXTickEv[] = [];
  let turnNum = 0;
  for (const line of htmlLines) {
    if (!line) continue;
    const txt = line;
    const ev: BSXTickEv = { txt };

    if (/Turn \d+|turn \d+|Comienzo del turno \d+/i.test(txt) || /^\|turn\|\d+/.test(txt)) {
      turnNum++;
      result.push({ turn: turnNum });
      continue;
    }

    // Classification runs against the English LogFormatter output ('p1' POV);
    // Spanish patterns are kept as fallback for localized/legacy logs.
    if (/fainted|ha sido debilitado|se debilitó/i.test(txt)) {
      ev.kind = "ko";
    } else if (/\bGo!|sent out|withdrew|came back|switched in|¡adelante|cambió a/i.test(txt)) {
      ev.kind = "switch";
    } else if (/(?:\brose\b|\bfell\b|sharply|drastically|won't go any (?:higher|lower)|subió|bajó)/i.test(txt)) {
      ev.kind = "boost";
    } else if (
      /started to (?:rain|hail|snow)|sandstorm|sunlight|rain continues|hail crashes|snow continu|battlefield|pointed stones|spikes were scattered|toxic spikes|sticky web|reflect raised|light screen raised|aurora veil|twisted the dimensions|electric current ran|grass grew|mist swirled|seeped into|lluvia|tormenta de arena|granizo|campo (?:eléctrico|de hierba|de niebla|psíquico)|espacio raro|rocas puntiagudas|púas|red viscosa/i.test(txt)
    ) {
      ev.kind = "field";
    } else if (/ used |usó|utiliza/i.test(txt)) {
      ev.kind = "move";
    }

    if (/super effective|súper eficaz|eficaz/i.test(txt)) ev.eff = "super";
    if (/not very effective|doesn't affect|had no effect|immune|resistido|no muy efectivo|poco eficaz|sin efecto|no afecta/i.test(txt)) ev.eff = "weak";
    if (/critical hit|golpe crítico/i.test(txt)) ev.crit = true;

    // Damage: "(Pikachu lost 12% of its health!)" or legacy "—12%" markers.
    const dmgMatch =
      txt.match(/lost ([\d.]+)% of its health/i) ||
      txt.match(/perdió (?:un )?([\d.]+)\s*%/i) ||
      txt.match(/[—-]\s*(\d+(?:\.\d+)?)[%％]/);
    if (dmgMatch) ev.dmg = `−${dmgMatch[1]}%`;

    // Anything without action markers and without combat data is system noise.
    if (!ev.kind && !ev.dmg && !ev.eff && !ev.crit) ev.kind = "sys";

    result.push(ev);
  }
  return result;
}

export function toTeamHP(
  team: Pokemon[] | Array<{ hp: number; fnt?: boolean; name?: string; maxhp?: number; condition?: string }>,
  /** Known team size (|teamsize| protocol) — unrevealed slots are padded as unknown. */
  totalPokemon?: number,
): TeamMemberHP[] {
  const known: TeamMemberHP[] = team.map((p) => {
    if (p instanceof Pokemon) {
      return { hp: Math.floor((p.hp / p.maxhp) * 100), fnt: p.hp <= 0, name: p.name };
    }
    return { hp: p.hp, fnt: p.fnt, name: p.name };
  });
  const size = Math.max(totalPokemon ?? 0, known.length);
  while (known.length < size) {
    known.push({ hp: 100, unknown: true });
  }
  return known;
}

export type { BSXMon, BSXKeyMove, BSXTickEv, TeamMemberHP };
