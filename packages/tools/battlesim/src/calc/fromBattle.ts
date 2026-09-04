/**
 * The live battle -> damage calculator seam.
 *
 * THIS MODULE IS READ-ONLY WITH RESPECT TO THE BATTLE, AND THAT IS ENFORCED
 * RATHER THAN INTENDED. It never touches `BattleSession`, the `TurnLedger`, the
 * scene or the request — it reads `@pkmn/client`'s `Battle` and returns fresh
 * literals built out of numbers and strings. No `@pkmn/client` object, and no
 * array or record owned by one, is ever handed out: `boosts`, `types` and the
 * move list are all copied. The result is then deep-frozen, so a panel that
 * writes to a snapshot gets a TypeError in its own state (every module here is
 * an ES module, so strict mode is not optional) instead of quietly corrupting
 * the object the engine is animating from.
 *
 * The other half of the contract is honesty about what a battle actually
 * reveals. Your own side publishes final stats in the choice request, so its
 * spread can be RECOVERED exactly (`solveSpread` inverts the stat formula — see
 * its header). The opponent publishes species, level, item and ability only
 * once they are revealed, and never EVs, IVs or nature. So every Pokémon
 * carries `spreadKnown`, and everything downstream must widen an unknown one
 * into a range instead of printing the number a default spread happened to
 * produce.
 */
import type { Battle, Pokemon as ClientPokemon, Side } from "@pkmn/client";
import { Dex } from "@pkmn/dex";
import {
  solveSpread,
  type CalcField,
  type CalcMove,
  type CalcPokemon,
  type MoveSlots,
  type SideConditions,
  type StatBoosts,
  type StatValues,
  type Terrain,
  type Weather,
} from "@boffmedia/tools-pokemon";
import type { BattleRequest } from "../engine/types";

/* ── Vocabulary bridges ──────────────────────────────────────────────────── */

/**
 * `@pkmn/client`'s field state ids -> the calculator's weather names.
 *
 * Both spellings answer on purpose. The client's `field.weatherState.id` holds
 * the CONDITION's id (`rain`), while a protocol line and this package's own
 * catalog name the MOVE that set it (`raindance`) — the exact mismatch that
 * once made every weather chip render as a raw id. A caller that resolved the
 * id the other way round must still land on the right weather here.
 */
const WEATHER: Record<string, Weather> = {
  sun: "Sun", sunnyday: "Sun",
  harshsunshine: "Harsh Sunshine", desolateland: "Harsh Sunshine",
  rain: "Rain", raindance: "Rain",
  heavyrain: "Heavy Rain", primordialsea: "Heavy Rain",
  sand: "Sand", sandstorm: "Sand",
  snow: "Snow", hail: "Snow",
  strongwinds: "Strong Winds", deltastream: "Strong Winds",
};

const TERRAIN: Record<string, Terrain> = {
  electric: "Electric", electricterrain: "Electric",
  grassy: "Grassy", grassyterrain: "Grassy",
  misty: "Misty", mistyterrain: "Misty",
  psychic: "Psychic", psychicterrain: "Psychic",
};

const toId = (raw: string | null | undefined): string =>
  (raw ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/* ── Snapshot shapes ─────────────────────────────────────────────────────── */

export interface CalcMonSnapshot {
  /** Stable across turns for the same Pokémon: `ally-0`, `foe-bench-2`… */
  key: string;
  /** The nickname the log uses. The species is on `poke.name`. */
  label: string;
  side: "ally" | "foe";
  /** Active slot (0 or 1 in doubles), or −1 on the bench. */
  slot: number;
  active: boolean;
  fainted: boolean;
  /** Share of max HP. The only HP figure an opponent ever exposes. */
  hpPct: number;
  /** Exact HP. Own side only — a foe's bar is a percentage and nothing more. */
  hpCur?: number;
  hpMax?: number;
  /**
   * Whether the EV/IV/nature spread on `poke` is the REAL one (recovered from
   * published final stats) or a placeholder. False means every number derived
   * from this Pokémon has to be shown as a range.
   */
  spreadKnown: boolean;
  /** Ready to hand to `calcDamage`, spread and all. */
  poke: CalcPokemon;
  /** Only the moves the battle has actually revealed. Often empty for a foe. */
  moves: CalcMove[];
}

export interface BattleCalcSnapshot {
  turn: number;
  /** `singles` | `doubles` — decides spread-move damage in the calculator. */
  gameType: string;
  /** Global conditions only; the two sides are kept apart below. */
  field: CalcField;
  allySide: SideConditions;
  foeSide: SideConditions;
  mons: CalcMonSnapshot[];
  /** Your first active, and the foe's — what the panel opens on. */
  defaultAttacker: string | null;
  defaultDefender: string | null;
}

const NO_SIDE: SideConditions = {
  stealthRock: false, spikes: 0, reflect: false, lightScreen: false,
  auroraVeil: false, tailwind: false, helpingHand: false,
};

const EMPTY_MOVE: CalcMove = { name: "", bp: 0, type: "Normal", category: "Physical", crit: false };

/* ── Freezing ────────────────────────────────────────────────────────────── */

/**
 * Freeze the whole snapshot, nested arrays and records included.
 *
 * Cheap (a snapshot is a few dozen small objects) and the reason the panel's
 * "seed from live, edit freely" model cannot go wrong: an edit is forced to
 * produce a new object, so a stale reference can never be found holding a value
 * the battle did not produce.
 */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

/* ── Per-Pokémon extraction ──────────────────────────────────────────────── */

const BASE_FALLBACK: StatValues = { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100 };

/**
 * The species name @smogon/calc will accept, and its base stats.
 *
 * A forme the calculator does not carry makes `new Pokemon` throw, which
 * `calcDamage` swallows into a null — a blank damage row with no explanation.
 * Falling back to the base forme gives a slightly wrong defence rather than no
 * answer at all, and the panel says which forme it used.
 */
function speciesFor(forme: string): { name: string; base: StatValues } {
  const dexed = Dex.species.get(forme);
  if (dexed?.exists) return { name: dexed.name, base: { ...dexed.baseStats } };
  const bare = Dex.species.get(forme.split("-")[0]);
  if (bare?.exists) return { name: bare.name, base: { ...bare.baseStats } };
  return { name: forme, base: { ...BASE_FALLBACK } };
}

/** Display name for an id, or undefined when nothing in the dex answers. */
function itemName(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const found = Dex.items.get(raw.replace(/^item:\s*/i, ""));
  return found?.exists ? found.name : undefined;
}

function abilityName(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const found = Dex.abilities.get(raw);
  return found?.exists ? found.name : undefined;
}

/**
 * A move as the calculator wants it: real name, real type, real base power.
 *
 * `bp: 0` survives on purpose for the variable-power moves (Gyro Ball, Acrobatics,
 * Grass Knot…). `calcDamage` refuses to guess for those and returns null, and
 * the panel turns that into "set the power yourself" — an editable field, not a
 * fabricated number.
 */
export function moveFor(id: string): CalcMove | null {
  const dexed = Dex.moves.get(id);
  if (!dexed?.exists) return null;
  return {
    name: dexed.name,
    bp: dexed.basePower,
    type: dexed.type,
    category: dexed.category as CalcMove["category"],
    crit: false,
  };
}

/** Exactly four move slots, padded — `CalcPokemon.moves` is a fixed tuple. */
function toMoveSlots(moves: CalcMove[]): MoveSlots {
  const slots: CalcMove[] = moves.slice(0, 4).map((m) => ({ ...m }));
  while (slots.length < 4) slots.push({ ...EMPTY_MOVE });
  return slots as MoveSlots;
}

const boostsOf = (raw: Record<string, number> | undefined): StatBoosts => ({
  atk: raw?.atk ?? 0, def: raw?.def ?? 0, spa: raw?.spa ?? 0,
  spd: raw?.spd ?? 0, spe: raw?.spe ?? 0,
});

interface Published {
  stats: Record<string, number>;
  maxhp?: number;
  item?: string;
  ability?: string;
  moves?: string[];
}

/**
 * `p1a: Incineroar` and `p1: Incineroar` are the same Pokémon.
 *
 * The protocol writes the ACTIVE SLOT letter into a field ident; a request does
 * not. @pkmn/client already knows this and builds `searchid` off the slotless
 * `originalIdent`, so both sides of the lookup are normalised the same way
 * here — key on the raw ident and your own side comes back as unknown as the
 * opponent's, spread and item included, with nothing to say it went wrong.
 */
const slotlessIdent = (ident: string): string => ident.replace(/^(p[1-4])[a-z]:/, "$1:");

/**
 * Everything the choice request published about one of YOUR Pokémon, keyed the
 * way the client keys the same Pokémon.
 *
 * `${ident}|${details}` is the client's own `searchid`, so the two halves of
 * the same Pokémon — the one on the field and the one in the request — line up
 * even across a forme change, which a species name alone would not survive.
 *
 * The request is also the only place your own ITEM and ABILITY are stated
 * outright: the field only reveals them once they have visibly done something,
 * so reading the field alone would leave your Assault Vest out of your own
 * defensive calculation.
 */
function publishedFromRequest(request: BattleRequest | null | undefined) {
  const table = new Map<string, Published>();
  for (const poke of request?.side?.pokemon ?? []) {
    const raw = poke as unknown as {
      ident?: string; details?: string; stats?: Record<string, number>;
      condition?: string; item?: string; ability?: string; baseAbility?: string; moves?: string[];
    };
    if (!raw.ident || !raw.details || !raw.stats) continue;
    const hp = raw.condition?.match(/^\d+\/(\d+)/);
    table.set(`${slotlessIdent(raw.ident)}|${raw.details}`, {
      stats: raw.stats,
      maxhp: hp ? Number(hp[1]) : undefined,
      item: raw.item,
      ability: raw.ability || raw.baseAbility,
      moves: raw.moves,
    });
  }
  return table;
}

function monSnapshot(
  pokemon: ClientPokemon,
  side: "ally" | "foe",
  slot: number,
  teamIndex: number,
  known: ReturnType<typeof publishedFromRequest>,
): CalcMonSnapshot {
  const forme = pokemon.speciesForme || pokemon.baseSpeciesForme || pokemon.name;
  const species = speciesFor(forme);
  const level = pokemon.level || 100;
  const maxhp = pokemon.maxhp > 0 ? pokemon.maxhp : undefined;
  const hpPct = maxhp && maxhp > 0 ? Math.max(0, Math.min(100, (pokemon.hp / maxhp) * 100)) : 0;

  // Already slotless: @pkmn/client builds it off `originalIdent`.
  const searchid = pokemon.searchid || "";
  const published = known.get(searchid);
  // A foe's `maxhp` is 100 because its bar IS a percentage; solving a spread
  // against that would produce a Pokémon with 100 HP. Only feed the solver
  // numbers the request published.
  const solved = published
    ? solveSpread(species.base, level, {
        hp: published.maxhp,
        atk: published.stats.atk, def: published.stats.def,
        spa: published.stats.spa, spd: published.stats.spd, spe: published.stats.spe,
      })
    : null;

  // Your own moveset comes from the request (all four, always); a foe's comes
  // from what it has actually used, and stays that short on purpose.
  const moveIds = published?.moves?.length
    ? published.moves
    : (pokemon.moveSlots ?? []).map((slotted) => String(slotted.id));
  const revealed = moveIds
    .map((id) => moveFor(id))
    .filter((m): m is CalcMove => !!m);

  const poke: CalcPokemon = {
    name: species.name,
    level,
    nature: solved?.nature ?? "Serious",
    ability: abilityName(published?.ability) ?? abilityName(pokemon.ability)
      ?? abilityName((pokemon as { baseAbility?: string }).baseAbility) ?? "",
    item: itemName(published?.item) ?? itemName(pokemon.item) ?? "None",
    status: pokemon.status || "Healthy",
    teraType: (pokemon.terastallized as string) || "None",
    evs: solved ? { ...solved.evs } : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: solved ? { ...solved.ivs } : { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: boostsOf(pokemon.boosts as Record<string, number>),
    // Full HP: the panel wants damage as a share of MAX, and computes "does it
    // KO from here" itself against `hpPct`. Handing the calculator the current
    // HP instead would silently redefine every percentage it prints.
    currentHP: -1,
    moves: toMoveSlots(revealed),
  };

  return {
    key: `${side}-${slot >= 0 ? `slot${slot}` : `bench${teamIndex}`}-${species.name}`,
    label: pokemon.name || species.name,
    side,
    slot,
    active: slot >= 0,
    fainted: pokemon.fainted || pokemon.hp <= 0,
    hpPct,
    hpCur: published ? pokemon.hp : undefined,
    hpMax: published ? maxhp : undefined,
    spreadKnown: !!solved,
    poke,
    moves: revealed,
  };
}

/* ── Field extraction ────────────────────────────────────────────────────── */

function sideConditions(side: Side): SideConditions {
  const raw = side.sideConditions as Record<string, { level?: number } | undefined>;
  const has = (id: string) => !!raw[id];
  const spikes = Math.max(0, Math.min(3, raw.spikes?.level ?? 0)) as SideConditions["spikes"];
  return {
    stealthRock: has("stealthrock"),
    spikes,
    reflect: has("reflect"),
    lightScreen: has("lightscreen"),
    auroraVeil: has("auroraveil"),
    tailwind: has("tailwind"),
    // A volatile on the Pokémon, not a side condition — the field never carries
    // it, so it starts off and the panel offers it as a toggle.
    helpingHand: false,
  };
}

/* ── The seam ────────────────────────────────────────────────────────────── */

export interface SnapshotOptions {
  /**
   * The current choice request. Without it your own side is as unknown as the
   * opponent's — the request is the ONLY place final stats appear.
   */
  request?: BattleRequest | null;
}

/**
 * Everything the damage panel needs, as inert data.
 *
 * `pov` decides which side is "ally", the same way `useBSXLayout` does: a PvP
 * player seated as p2 must not be handed the opponent's team as their own.
 */
export function snapshotBattle(battle: Battle, pov: 0 | 1 = 0, opts: SnapshotOptions = {}): BattleCalcSnapshot {
  const you = pov === 0 ? battle.p1 : battle.p2;
  const foe = pov === 0 ? battle.p2 : battle.p1;
  const known = publishedFromRequest(opts.request);

  const mons: CalcMonSnapshot[] = [];
  const seen = new Set<ClientPokemon>();
  for (const [tag, side] of [["ally", you], ["foe", foe]] as const) {
    side.active.forEach((pokemon, index) => {
      if (!pokemon) return;
      seen.add(pokemon);
      mons.push(monSnapshot(pokemon, tag, index, index, known));
    });
    // The bench is what the protocol has revealed, which for a foe is only the
    // Pokémon that have already been out. That is the point: the panel offers
    // what is known and nothing else.
    side.team.forEach((pokemon, index) => {
      if (!pokemon || seen.has(pokemon)) return;
      seen.add(pokemon);
      mons.push(monSnapshot(pokemon, tag, -1, index, known));
    });
  }

  const weatherId = toId((battle.field.weatherState as { id?: string } | undefined)?.id);
  const terrainId = toId((battle.field.terrainState as { id?: string } | undefined)?.id);
  const pseudo = battle.field.pseudoWeather as Record<string, unknown>;

  const gameType = String(battle.gameType || "singles").toLowerCase();
  const field: CalcField = {
    format: gameType === "doubles" ? "Doubles" : "Singles",
    weather: WEATHER[weatherId] ?? "None",
    terrain: TERRAIN[terrainId] ?? "None",
    trickRoom: !!pseudo.trickroom,
    gravity: !!pseudo.gravity,
    magicRoom: !!pseudo.magicroom,
    wonderRoom: !!pseudo.wonderroom,
    // Placeholders: which side is "attacker" depends on who the panel points at
    // each other, so the real conditions travel beside the field and
    // `fieldFor` assigns them at calculation time.
    attackerSide: { ...NO_SIDE },
    defenderSide: { ...NO_SIDE },
  };

  const firstActive = (tag: "ally" | "foe") =>
    mons.find((m) => m.side === tag && m.active && !m.fainted)?.key ?? null;

  return deepFreeze({
    turn: battle.turn,
    gameType,
    field,
    allySide: sideConditions(you),
    foeSide: sideConditions(foe),
    mons,
    defaultAttacker: firstActive("ally"),
    defaultDefender: firstActive("foe"),
  });
}

/**
 * The field with `attackerSide` / `defenderSide` filled in for one direction.
 *
 * Screens are the reason this is not baked into the snapshot: Reflect belongs
 * to the side being HIT, and the panel lets the player point either team at the
 * other, so the assignment cannot be decided while reading the battle.
 */
export function fieldFor(
  snapshot: BattleCalcSnapshot,
  attackerSide: "ally" | "foe",
  overrides?: Partial<CalcField>,
): CalcField {
  const attacker = attackerSide === "ally" ? snapshot.allySide : snapshot.foeSide;
  const defender = attackerSide === "ally" ? snapshot.foeSide : snapshot.allySide;
  return {
    ...snapshot.field,
    ...overrides,
    attackerSide: { ...attacker, ...overrides?.attackerSide },
    defenderSide: { ...defender, ...overrides?.defenderSide },
  };
}
