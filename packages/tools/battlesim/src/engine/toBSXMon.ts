import { Pokemon } from "@pkmn/client";
import { Dex } from "@pkmn/dex";

type BSXMon = {
  id: string; name: string; types: string[]; hp: number; fnt?: boolean; tera?: boolean;
  teraType?: string; status?: string | null; boosts?: Record<string, number>;
  stats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves?: any[]; sleepT?: number; protect?: boolean;
  /** Exact HP when the source knows it (own side). Foes only expose a percent. */
  hpCur?: number; hpMax?: number;
  /** Request-side extras. */
  active?: boolean; item?: string; ability?: string; level?: number; moveIds?: string[];
  /** The `poke` slot name when it differs from the species (nicknames). */
  species?: string;
};

type BSXKeyMove = {
  name: string; type: string; cat: string; power: number;
  acc: number | null; pp: number; maxpp: number;
  prio?: number; spread?: string; effect?: string;
  /** Request extras: the move id, its target class and whether the sim disabled it this turn. */
  id?: string; target?: string; disabled?: boolean;
};

type BSXTickEv = {
  turn?: number; kind?: string; who?: string;
  type?: string; crit?: boolean; txt?: string;
  dmg?: string; eff?: string; boost?: string;
};

type TeamMemberHP = { hp: number; fnt?: boolean; name?: string; unknown?: boolean };

/**
 * Percent for a bar: ceiled, and never 0 for a living Pokémon. 1/300 used to
 * floor to "0%" on a mon that was still standing.
 */
export function hpPercent(cur: number, max: number): number {
  if (!(max > 0) || cur <= 0) return 0;
  return Math.max(1, Math.min(100, Math.ceil((cur / max) * 100)));
}

export function toBSXMon(pokemon: Pokemon | null): BSXMon | null {
  if (!pokemon) return null;
  const species = pokemon.species;
  const stats = species?.baseStats || { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const knownMax = pokemon.maxhp > 0 ? pokemon.maxhp : 100;
  return {
    id: pokemon.speciesForme?.toLowerCase() || pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: pokemon.name,
    species: pokemon.speciesForme,
    types: [...pokemon.types] as string[],
    hp: hpPercent(pokemon.hp, knownMax),
    hpCur: pokemon.hp,
    hpMax: knownMax,
    fnt: pokemon.hp <= 0 || pokemon.fainted,
    tera: !!pokemon.terastallized,
    teraType: pokemon.terastallized,
    status: pokemon.status || null,
    boosts: { ...(pokemon.boosts as Record<string, number>) },
    stats: {
      hp: stats.hp, atk: stats.atk, def: stats.def,
      spa: stats.spa, spd: stats.spd, spe: stats.spe,
    },
    protect: !!pokemon.volatiles?.protect,
    item: pokemon.item || undefined,
    ability: pokemon.ability || undefined,
    level: pokemon.level,
    moveIds: (pokemon.moveSlots || []).map((m) => String(m.id)),
  };
}

/** Hoisted for the same reason as {@link stripTags}. */
function spreadOf(target?: string): string | undefined {
  return target === "allAdjacentFoes" ? "foes" : target === "allAdjacent" || target === "all" ? "all" : undefined;
}

export function toBSXKeyMoves(
  moves: Array<{ name?: string; id: string; pp?: number; maxpp?: number; target?: string; disabled?: boolean }> | undefined
): BSXKeyMove[] {
  if (!moves) return [];
  return moves.map((m) => {
    const dexMove = Dex.moves.get(m.id);
    const pp = m.pp ?? 1;
    const maxpp = m.maxpp ?? Math.max(1, pp);
    if (!dexMove?.exists) {
      return { id: m.id, name: m.name || m.id, type: "Normal", cat: "status", power: 0, acc: null, pp, maxpp, target: m.target, disabled: m.disabled };
    }
    const catMap: Record<string, string> = { Physical: "phys", Special: "spec", Status: "status" };
    const target = m.target ?? dexMove.target;
    return {
      id: m.id,
      name: dexMove.name,
      type: dexMove.type,
      cat: catMap[dexMove.category] || "status",
      power: dexMove.basePower,
      acc: dexMove.accuracy === true ? null : dexMove.accuracy,
      pp,
      maxpp,
      prio: dexMove.priority || undefined,
      spread: spreadOf(target),
      target,
      disabled: m.disabled,
    };
  });
}

export function requestPokemonToBSXMon(
  poke: { ident: string; condition: string; active?: boolean; stats?: any; details?: string; item?: string; ability?: string; baseAbility?: string; moves?: string[]; teraType?: string; terastallized?: string }
): BSXMon {
  const nickname = poke.ident?.split(": ")[1] || "Unknown";
  const detailParts = (poke.details || "").split(",").map((s) => s.trim());
  const speciesName = detailParts[0] || nickname;
  const levelPart = detailParts.find((p) => /^L\d+$/.test(p));
  const species = Dex.species.get(speciesName);
  const stats = species?.exists
    ? { hp: species.baseStats.hp, atk: species.baseStats.atk, def: species.baseStats.def, spa: species.baseStats.spa, spd: species.baseStats.spd, spe: species.baseStats.spe }
    : { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };
  const isFnt = poke.condition?.includes("fnt");
  const hpMatch = poke.condition?.match(/^(\d+)\/(\d+)/);
  const hpCur = hpMatch ? parseInt(hpMatch[1]) : isFnt ? 0 : undefined;
  const hpMax = hpMatch ? parseInt(hpMatch[2]) : undefined;
  const hpPct = hpMatch ? hpPercent(hpCur!, hpMax!) : (isFnt ? 0 : 100);
  const statusMatch = poke.condition?.match(/ ([a-z]{3})$/);
  const status = isFnt ? "fnt" : statusMatch?.[1] || null;
  return {
    id: speciesName.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: nickname,
    species: speciesName,
    types: species?.exists ? [...species.types] : ["Normal"],
    hp: Math.max(0, Math.min(100, hpPct)),
    hpCur,
    hpMax,
    fnt: !!isFnt,
    status,
    stats,
    active: !!poke.active,
    item: poke.item || undefined,
    ability: poke.ability || poke.baseAbility || undefined,
    level: levelPart ? parseInt(levelPart.slice(1)) : 100,
    moveIds: poke.moves,
    tera: !!poke.terastallized,
    teraType: poke.terastallized || poke.teraType,
  };
}

/* ── Log line translation ────────────────────────────────────────────────── */

/** The catalog translator, narrowed to what the log needs. */
export type LogT = (key: string, values?: Record<string, string | number>) => string;

/**
 * The log's markup carries no meaning for classification — only its words do.
 *
 * A hoisted `function`, not a `const` arrow: the arrow lives below the module's
 * other exports in source order, and a stale module in the renderer's HMR graph
 * reached `toBSXTicks` before the binding was initialised, which threw a
 * ReferenceError out of a render and blanked the Play screen. A declaration
 * cannot be in that state.
 */
function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

/** English stat words as the formatter prints them → `battle.labels.stat` keys. */
const STAT_KEY: Record<string, string> = {
  Attack: "atk", Defense: "def", "Sp. Atk": "spa", "Sp. Def": "spd",
  Speed: "spe", accuracy: "accuracy", evasiveness: "evasion",
};

type LogVals = Record<string, string | number>;
interface LogRule {
  re: RegExp;
  /** Key under `battle.logTx`. */
  key: string;
  /** Capture groups → message values. Defaults to `{ name: poke(m[1]) }`. */
  vals?: (m: RegExpMatchArray, poke: (s: string) => string, stat: (s: string) => string) => LogVals;
}

/**
 * Every English template this layer knows, most specific first.
 *
 * `@pkmn/view`'s `LogFormatter` builds its text from a table compiled into the
 * package, exposed neither as data nor behind a locale, so its OUTPUT is the
 * only seam left: each line is matched against the template that produced it
 * and re-rendered from the catalog. A line no rule claims passes through in
 * English, which is what the hundreds of per-move and per-ability templates
 * outside this list do regardless.
 *
 * Species, move, ability and item names are never translated — they are the
 * same proper nouns every other surface of the tool shows.
 */
const LOG_RULES: LogRule[] = [
  // Framing.
  { re: /^Battle started between (.+) and (.+)!$/, key: "startBattle", vals: (m) => ({ a: m[1], b: m[2] }) },
  { re: /^(<strong>.+<\/strong>) won the battle!$/, key: "win", vals: (m) => ({ name: m[1] }) },
  { re: /^Tie between (.+) and (.+)!$/, key: "tie", vals: (m) => ({ a: m[1], b: m[2] }) },

  // Switches.
  { re: /^Go! (<strong>.+<\/strong>)!$/, key: "switchInOwn", vals: (m) => ({ name: m[1] }) },
  { re: /^(.+?) sent out (<strong>.+<\/strong>)!$/, key: "switchIn", vals: (m) => ({ trainer: m[1], name: m[2] }) },
  { re: /^(.+), come back!$/, key: "switchOutOwn" },
  { re: /^(.+?) withdrew (.+)!$/, key: "switchOut", vals: (m, p) => ({ trainer: m[1], name: p(m[2]) }) },
  { re: /^(.+) was dragged out!$/, key: "drag" },
  { re: /^(.+) fainted!$/, key: "faint" },

  // Actions.
  { re: /^(.+?) used (<strong>.+<\/strong>)!$/, key: "move", vals: (m, p) => ({ name: p(m[1]), move: m[2] }) },
  { re: /^\[(.+?)'s (.+)\]$/, key: "ability", vals: (m, p) => ({ name: p(m[1]), ability: m[2] }) },
  { re: /^But it failed!$/, key: "fail", vals: () => ({}) },
  { re: /^But there was no target\.\.\.$/, key: "noTarget", vals: () => ({}) },

  // Outcome.
  { re: /^A critical hit!$/, key: "crit", vals: () => ({}) },
  { re: /^A critical hit on (.+)!$/, key: "critOn" },
  { re: /^It's super effective!$/, key: "superEff", vals: () => ({}) },
  { re: /^It's super effective on (.+)!$/, key: "superEffOn" },
  { re: /^It's not very effective\.\.\.$/, key: "resisted", vals: () => ({}) },
  { re: /^It's not very effective on (.+)\.$/, key: "resistedOn" },
  { re: /^It doesn't affect (.+)\.\.\.$/, key: "immune" },
  { re: /^It had no effect!$/, key: "noEffect", vals: () => ({}) },
  { re: /^(.+) is unaffected!$/, key: "unaffected" },
  { re: /^(.+) avoided the attack!$/, key: "miss" },
  { re: /^(.+?)'s attack missed!$/, key: "missNo" },
  { re: /^It's a one-hit KO!$/, key: "ohko", vals: () => ({}) },
  { re: /^The Pok.mon was hit 1 time!$/, key: "hit1", vals: () => ({}) },
  { re: /^The Pok.mon was hit (\d+) times!$/, key: "hits", vals: (m) => ({ n: m[1] }) },

  // Status. Ahead of the generic damage and "can't move" rules below, whose
  // patterns are loose enough to swallow "was hurt by its burn!" and
  // "is paralyzed! It can't move!".
  { re: /^(.+) was burned!$/, key: "burned" },
  { re: /^(.+?) was hurt by its burn!$/, key: "burnDamage" },
  { re: /^(.+?)'s burn was healed!$/, key: "burnHealed" },
  { re: /^(.+) is already burned!$/, key: "alreadyBurned" },
  { re: /^(.+) is paralyzed! It may be unable to move!$/, key: "paralyzed" },
  { re: /^(.+) is paralyzed! It can't move!$/, key: "paralyzedCant" },
  { re: /^(.+) is already paralyzed!$/, key: "alreadyParalyzed" },
  { re: /^(.+) was cured of paralysis!$/, key: "paraCured" },
  { re: /^(.+) was badly poisoned!$/, key: "badlyPoisoned" },
  { re: /^(.+) was poisoned!$/, key: "poisoned" },
  { re: /^(.+?) was hurt by poison!$/, key: "poisonDamage" },
  { re: /^(.+) is already poisoned!$/, key: "alreadyPoisoned" },
  { re: /^(.+) was cured of its poisoning!$/, key: "poisonCured" },
  { re: /^(.+) fell asleep!$/, key: "asleep" },
  { re: /^(.+) is fast asleep\.$/, key: "fastAsleep" },
  { re: /^(.+) is already asleep!$/, key: "alreadyAsleep" },
  { re: /^(.+) woke up!$/, key: "wokeUp" },
  { re: /^(.+) was frozen solid!$/, key: "frozen" },
  { re: /^(.+) is frozen solid!$/, key: "frozenCant" },
  { re: /^(.+) is already frozen solid!$/, key: "alreadyFrozen" },
  { re: /^(.+) thawed out!$/, key: "thawed" },
  { re: /^(.+) became confused!$/, key: "confused" },
  { re: /^(.+) is confused!$/, key: "confusedActivate" },
  { re: /^(.+) is already confused!$/, key: "alreadyConfused" },
  { re: /^(.+) snapped out of its confusion!$/, key: "confusedEnd" },
  { re: /^It hurt itself in its confusion!$/, key: "confusedHurt", vals: () => ({}) },
  { re: /^(.+) flinched and couldn't move!$/, key: "flinched" },
  { re: /^(.+) protected itself!$/, key: "protected" },

  // Weather.
  { re: /^A sandstorm kicked up!$/, key: "sandStart", vals: () => ({}) },
  { re: /^\(The sandstorm is raging\.\)$/, key: "sandUpkeep", vals: () => ({}) },
  { re: /^The sandstorm subsided\.$/, key: "sandEnd", vals: () => ({}) },
  { re: /^(.+) is buffeted by the sandstorm!$/, key: "sandDamage" },
  { re: /^It started to rain!$/, key: "rainStart", vals: () => ({}) },
  { re: /^\(Rain continues to fall\.\)$/, key: "rainUpkeep", vals: () => ({}) },
  { re: /^The rain stopped\.$/, key: "rainEnd", vals: () => ({}) },
  { re: /^The sunlight turned harsh!$/, key: "sunStart", vals: () => ({}) },
  { re: /^\(The sunlight is strong\.\)$/, key: "sunUpkeep", vals: () => ({}) },
  { re: /^The harsh sunlight faded\.$/, key: "sunEnd", vals: () => ({}) },
  { re: /^It started to hail!$/, key: "hailStart", vals: () => ({}) },
  { re: /^\(The hail is crashing down\.\)$/, key: "hailUpkeep", vals: () => ({}) },
  { re: /^The hail stopped\.$/, key: "hailEnd", vals: () => ({}) },
  { re: /^(.+) is buffeted by the hail!$/, key: "hailDamage" },
  { re: /^It started to snow!$/, key: "snowStart", vals: () => ({}) },
  { re: /^\(The snow is falling down\.\)$/, key: "snowUpkeep", vals: () => ({}) },
  { re: /^The snow stopped\.$/, key: "snowEnd", vals: () => ({}) },

  // Hazards, screens, terrain and the generic effect lines.
  { re: /^Pointed stones float in the air around (.+)!$/, key: "srStart" },
  { re: /^The pointed stones disappeared from around (.+)!$/, key: "srEnd" },
  { re: /^Pointed stones dug into (.+)!$/, key: "srDamage" },
  { re: /^Spikes were scattered on the ground all around (.+)!$/, key: "spikesStart" },
  { re: /^The spikes disappeared from the ground around (.+)!$/, key: "spikesEnd" },
  { re: /^(.+) was hurt by the spikes!$/, key: "spikesDamage" },
  { re: /^Poison spikes were scattered on the ground all around (.+)!$/, key: "tspikesStart" },
  { re: /^The poison spikes disappeared from the ground around (.+)!$/, key: "tspikesEnd" },
  { re: /^A sticky web has been laid out on the ground around (.+)!$/, key: "webStart" },
  { re: /^The sticky web has disappeared from the ground around (.+)!$/, key: "webEnd" },
  { re: /^(.+) was caught in a sticky web!$/, key: "webCaught" },
  { re: /^Reflect made (.+) stronger against physical moves!$/, key: "reflectStart" },
  { re: /^(.+?)'s Reflect wore off!$/, key: "reflectEnd" },
  { re: /^Light Screen made (.+) stronger against special moves!$/, key: "screenStart" },
  { re: /^(.+?)'s Light Screen wore off!$/, key: "screenEnd" },
  { re: /^The Tailwind blew from behind (.+)!$/, key: "tailwindStart" },
  { re: /^(.+?)'s Tailwind petered out!$/, key: "tailwindEnd" },
  { re: /^(.+) twisted the dimensions!$/, key: "trickroomStart" },
  { re: /^The twisted dimensions returned to normal!$/, key: "trickroomEnd", vals: () => ({}) },
  { re: /^An electric current ran across the battlefield!$/, key: "electricTerrain", vals: () => ({}) },
  { re: /^Grass grew to cover the battlefield!$/, key: "grassyTerrain", vals: () => ({}) },
  { re: /^Mist swirled around the battlefield!$/, key: "mistyTerrain", vals: () => ({}) },
  { re: /^The battlefield got weird!$/, key: "psychicTerrain", vals: () => ({}) },
  { re: /^(.+) was seeded!$/, key: "seeded" },
  { re: /^(.+?)'s health is sapped by Leech Seed!$/, key: "seedDamage" },
  { re: /^(.+?) knocked off (.+?)'s (.+)!$/, key: "knockOff", vals: (m, p) => ({ name: p(m[1]), target: p(m[2]), item: m[3] }) },
  { re: /^(.+?)'s type changed to (.+)!$/, key: "typeChange", vals: (m, p) => ({ name: p(m[1]), type: m[2] }) },
  { re: /^\((.+?) started on (.+)!\)$/, key: "effectStart", vals: (m, p) => ({ effect: m[1], name: p(m[2]) }) },
  { re: /^(.+?) was freed from (.+)!$/, key: "effectEnd", vals: (m, p) => ({ name: p(m[1]), effect: m[2] }) },
  { re: /^\((.+) activated!\)$/, key: "effectActivate", vals: (m) => ({ effect: m[1] }) },

  // Immobilised — generic, so it runs after the status lines that end the same way.
  { re: /^(.+) can't move!$/, key: "cantMove" },
  { re: /^(.+?) can't use (.+)!$/, key: "cant", vals: (m, p) => ({ name: p(m[1]), move: m[2] }) },

  // Damage and healing — generic, for the same reason.
  { re: /^\((.+?) lost (.+) of its health!\)$/, key: "dmgPct", vals: (m, p) => ({ name: p(m[1]), pct: m[2] }) },
  { re: /^\((.+) was hurt!\)$/, key: "dmg" },
  { re: /^(.+?) was hurt by its (.+)!$/, key: "dmgItemOwn", vals: (m, p) => ({ name: p(m[1]), item: m[2] }) },
  { re: /^(.+?) was hurt by (.+?)'s (.+)!$/, key: "dmgItemFoe", vals: (m, p) => ({ name: p(m[1]), source: p(m[2]), item: m[3] }) },
  { re: /^(.+?) is hurt by (.+)!$/, key: "dmgMove", vals: (m, p) => ({ name: p(m[1]), move: m[2] }) },
  { re: /^(.+) had its HP restored\.$/, key: "heal" },
  { re: /^(.+?) restored a little HP using its (.+)!$/, key: "healLittle", vals: (m, p) => ({ name: p(m[1]), item: m[2] }) },
  { re: /^(.+?) restored HP using its (.+)!$/, key: "healEffect", vals: (m, p) => ({ name: p(m[1]), effect: m[2] }) },
  { re: /^(.+?)'s HP is full!$/, key: "hpFull" },

  // Stat changes.
  { re: /^(.+?)'s (.+?) rose sharply!$/, key: "boost2", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) rose drastically!$/, key: "boost3", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) rose!$/, key: "boost1", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) won't go any higher!$/, key: "boost0", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) fell harshly!$/, key: "unboost2", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) fell severely!$/, key: "unboost3", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) fell!$/, key: "unboost1", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s (.+?) won't go any lower!$/, key: "unboost0", vals: (m, p, s) => ({ name: p(m[1]), stat: s(m[2]) }) },
  { re: /^(.+?)'s stat changes were removed!$/, key: "clearBoost" },

  { re: /^(.+?) has Terastallized into the (.+)-type!$/, key: "tera", vals: (m, p) => ({ name: p(m[1]), type: m[2] }) },
];

/**
 * Builds the log translator for the active locale.
 *
 * A factory rather than a hook so the pure log pipeline in this module stays
 * free of React; `useBSXLayout` memoises it per translator.
 */
export function makeLogTranslator(t: LogT): (html: string) => string {
  const poke = (raw: string): string => {
    const s = raw.trim();
    const opp = s.match(/^the opposing (.+)$/i);
    if (opp) return t("battle.logTx.opposing", { name: opp[1] });
    if (/^the opposing team$/i.test(s)) return t("battle.logTx.foeTeam");
    if (/^your team$/i.test(s)) return t("battle.logTx.yourTeam");
    return s;
  };
  const stat = (raw: string): string => {
    const key = STAT_KEY[raw.trim()];
    return key ? t(`battle.labels.stat.${key}`) : raw;
  };
  const line = (seg: string): string => {
    const body = seg.trim();
    if (!body) return seg;
    for (const rule of LOG_RULES) {
      const m = body.match(rule.re);
      if (!m) continue;
      const vals = rule.vals ? rule.vals(m, poke, stat) : { name: poke(m[1]) };
      return t(`battle.logTx.${rule.key}`, vals);
    }
    return seg;
  };
  return (html: string) =>
    html
      .split(/<br\s*\/?>/i)
      .map((seg) => {
        const small = seg.match(/^<small>([\s\S]*)<\/small>$/);
        return small ? `<small>${line(small[1])}</small>` : line(seg);
      })
      .join("<br>");
}

export function toBSXTicks(htmlLines: string[], translate?: (html: string) => string): BSXTickEv[] {
  const result: BSXTickEv[] = [];
  let turnNum = 0;
  for (const line of htmlLines ?? []) {
    if (typeof line !== "string" || !line) continue;
    // Classification reads the PLAIN text of the English formatter output: the
    // markers it looks for ("lost 12.7% of its health") are split across
    // `<abbr>`/`<small>` tags in the raw HTML, so matching the HTML silently
    // missed every damage chip. Display copy is translated afterwards, so the
    // patterns below never have to know about the catalog.
    const txt = stripTags(line);
    // The log is chrome around a live battle: a line this layer cannot parse
    // must degrade to the raw formatter output, never take the screen with it.
    let shown = line;
    if (translate) {
      try { shown = translate(line); } catch { shown = line; }
    }
    const ev: BSXTickEv = { txt: shown };

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
      return { hp: hpPercent(p.hp, p.maxhp), fnt: p.hp <= 0 || p.fainted, name: p.name };
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
