import { Pokemon } from "@pkmn/client";
import { Dex } from "@pkmn/dex";
import type { BSXMon } from "@/components/boffmedia/primitives";

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

type TeamMemberHP = { hp: number; fnt?: boolean; name?: string };

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

    if (/ha sido debilitado|se debilitó|fainted/i.test(txt)) {
      ev.kind = "sys";
    } else if (/cambió|switch|¡adelante|Cambio/i.test(txt)) {
      ev.kind = "switch";
    } else if (/subió|bajó|boost|redujo|increment|fell|rose|sube|baja/i.test(txt)) {
      ev.kind = "boost";
    } else if (/usó|used|atacar|utiliza/i.test(txt) && !ev.kind) {
      ev.kind = "move";
    }

    if (/eficaz/i.test(txt)) ev.eff = "super";
    if (/resistido|no muy efectivo|sin efecto|immune|no efectivo/i.test(txt)) ev.eff = "weak";
    if (/crit|golpe crítico/i.test(txt)) ev.crit = true;

    const dmgMatch = txt.match(/[—-]\s*(\d+[%％]?)/);
    if (dmgMatch) ev.dmg = dmgMatch[1];

    result.push(ev);
  }
  return result;
}

export function toTeamHP(
  team: Pokemon[] | Array<{ hp: number; fnt?: boolean; name?: string; maxhp?: number; condition?: string }>
): TeamMemberHP[] {
  return team.map((p) => {
    if (p instanceof Pokemon) {
      return { hp: Math.floor((p.hp / p.maxhp) * 100), fnt: p.hp <= 0, name: p.name };
    }
    return { hp: p.hp, fnt: p.fnt, name: p.name };
  });
}

export type { BSXKeyMove, BSXTickEv, TeamMemberHP };
