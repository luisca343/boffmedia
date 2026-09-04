import type { Battle } from "@pkmn/client";
import type { ArgType, BattleArgsKWArgsTypes } from "@pkmn/protocol";

/**
 * "What happened to this Pokemon THIS TURN", derived from protocol lines only.
 *
 * The plates used to reverse-engineer this from HP deltas observed between
 * renders, which is guesswork: a multi-hit move and a hit-plus-residual look
 * identical to a differ, and a mon that switched in mid-turn inherited the
 * damage its predecessor took. The ledger records the events themselves, in
 * order, keyed by identity — so a renderer asks instead of infers.
 *
 * Pure: no DOM, no timers, no animation. Recorded AFTER `battle.add`, so every
 * `to` is the value the client state actually holds.
 */

export type LedgerEventKind = 'damage' | 'heal' | 'sethp' | 'switchin' | 'faint';

export interface LedgerEvent {
  kind: LedgerEventKind;
  /** HP before the event, in absolute points. */
  from: number;
  /** HP after the event. */
  to: number;
  maxhp: number;
  /** `[from]` clause, verbatim ("psn", "item: Leftovers", "Stealth Rock"). */
  source?: string;
  turn: number;
}

export interface LedgerEntry {
  key: string;
  turn: number;
  /** HP at the start of `turn` — or at switch-in, for a mon that entered mid-turn. */
  startHp: number;
  startMaxhp: number;
  hp: number;
  maxhp: number;
  events: LedgerEvent[];
}

/** Anything shaped enough like a @pkmn/client Pokemon to be keyed. */
export interface LedgerPokemonLike {
  originalIdent?: string;
  ident?: string;
  side?: { id?: string; n?: number };
  hp?: number;
  maxhp?: number;
}

/**
 * `side.id` is the PLAYER NAME id ("alice"), not "p1" — keying on it makes the
 * ledger unreadable from a slot code and collides across rooms. The side always
 * comes from the ident prefix.
 */
export function sideIdOf(identOrPokemon: string | LedgerPokemonLike): 'p1' | 'p2' {
  const raw = typeof identOrPokemon === 'string'
    ? identOrPokemon
    : (identOrPokemon.originalIdent || identOrPokemon.ident || '');
  if (raw.slice(0, 2) === 'p2') return 'p2';
  if (raw.slice(0, 2) === 'p1') return 'p1';
  if (typeof identOrPokemon !== 'string' && typeof identOrPokemon.side?.n === 'number') {
    return (identOrPokemon.side!.n as number) % 2 === 1 ? 'p2' : 'p1';
  }
  return 'p1';
}

export function ledgerKey(sideId: 'p1' | 'p2', originalIdent: string): string {
  return `${sideId}|${originalIdent}`;
}

/** `p1a: Pikachu` → the Pokemon the client currently holds under that identity. */
function resolvePokemon(battle: Battle | null | undefined, ident: string): LedgerPokemonLike | null {
  if (!battle || !ident) return null;
  const sideId = sideIdOf(ident);
  const side: any = (battle as any)[sideId];
  if (!side) return null;
  const colon = ident.indexOf(':');
  const name = colon >= 0 ? ident.slice(colon + 1).trim() : ident;
  const original = `${sideId}: ${name}`;

  const slotChar = ident.charAt(2);
  const slot = slotChar >= 'a' && slotChar <= 'z' ? slotChar.charCodeAt(0) - 97 : -1;
  const active = slot >= 0 ? (side.active?.[slot] ?? null) : null;
  if (active && (active.originalIdent === original || active.name === name)) return active;

  const found = side.team?.find(
    (p: any) => p && (p.originalIdent === original || p.name === name),
  );
  return found ?? active ?? null;
}

const num = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export class TurnLedger {
  /** 0 before the first `|turn|`. */
  turn = 0;
  private entries = new Map<string, LedgerEntry>();

  reset(): void {
    this.turn = 0;
    this.entries.clear();
  }

  /** Every entry, in insertion order. */
  all(): LedgerEntry[] {
    return [...this.entries.values()];
  }

  getByKey(key: string): LedgerEntry | undefined {
    return this.entries.get(key);
  }

  get(pokemon: LedgerPokemonLike | null | undefined): LedgerEntry | undefined {
    if (!pokemon) return undefined;
    const ident = pokemon.originalIdent || pokemon.ident || '';
    if (!ident) return undefined;
    return this.entries.get(ledgerKey(sideIdOf(pokemon), ident));
  }

  /** HP lost since the start of the turn (or since switch-in). Never negative. */
  lostThisTurn(entry: LedgerEntry | null | undefined): number {
    if (!entry) return 0;
    return Math.max(0, entry.startHp - entry.hp);
  }

  /** HP gained since the start of the turn (or since switch-in). Never negative. */
  gainedThisTurn(entry: LedgerEntry | null | undefined): number {
    if (!entry) return 0;
    return Math.max(0, entry.hp - entry.startHp);
  }

  /**
   * Applies one protocol line. Call AFTER `battle.add`, so the Pokemon read
   * here already carries the new HP.
   */
  record(args: ArgType, kwArgs: BattleArgsKWArgsTypes | undefined, battle: Battle): void {
    const type = String(args[0] ?? '');

    if (type === 'turn') {
      this.turn = num(args[1], this.turn + 1);
      this.snapshot(battle);
      return;
    }

    const ident = String(args[1] ?? '');
    if (!ident) return;

    switch (type) {
      case 'switch':
      case 'drag':
      case 'replace': {
        const poke = resolvePokemon(battle, ident);
        if (!poke) return;
        const entry = this.entryFor(poke);
        const hp = num(poke.hp, entry.hp);
        const maxhp = num(poke.maxhp, entry.maxhp) || entry.maxhp;
        // A mon that enters mid-turn shows only what happened AFTER it entered.
        entry.events = [];
        entry.startHp = hp;
        entry.startMaxhp = maxhp;
        entry.hp = hp;
        entry.maxhp = maxhp;
        entry.turn = this.turn;
        entry.events.push({ kind: 'switchin', from: hp, to: hp, maxhp, turn: this.turn });
        return;
      }
      case '-damage':
      case '-heal':
      case '-sethp': {
        const poke = resolvePokemon(battle, ident);
        if (!poke) return;
        const entry = this.entryFor(poke);
        const from = entry.hp;
        const to = num(poke.hp, from);
        const maxhp = num(poke.maxhp, entry.maxhp) || entry.maxhp;
        entry.hp = to;
        entry.maxhp = maxhp;
        entry.turn = this.turn;
        const source = (kwArgs as any)?.from ? String((kwArgs as any).from) : undefined;
        const kind: LedgerEventKind =
          type === '-damage' ? 'damage' : type === '-heal' ? 'heal' : 'sethp';
        entry.events.push({ kind, from, to, maxhp, source, turn: this.turn });
        return;
      }
      case 'faint': {
        const poke = resolvePokemon(battle, ident);
        if (!poke) return;
        const entry = this.entryFor(poke);
        const from = entry.hp;
        entry.hp = 0;
        entry.turn = this.turn;
        entry.events.push({ kind: 'faint', from, to: 0, maxhp: entry.maxhp, turn: this.turn });
        return;
      }
      default:
        return;
    }
  }

  /** Re-baselines every known Pokemon on both teams and clears their events. */
  snapshot(battle: Battle): void {
    for (const sideId of ['p1', 'p2'] as const) {
      const side: any = (battle as any)[sideId];
      if (!side) continue;
      const seen = new Set<any>();
      for (const list of [side.team, side.active] as any[]) {
        if (!list) continue;
        for (const poke of list) {
          if (!poke || seen.has(poke)) continue;
          seen.add(poke);
          const entry = this.entryFor(poke);
          const hp = num(poke.hp, entry.hp);
          const maxhp = num(poke.maxhp, entry.maxhp) || entry.maxhp;
          entry.startHp = hp;
          entry.startMaxhp = maxhp;
          entry.hp = hp;
          entry.maxhp = maxhp;
          entry.turn = this.turn;
          entry.events = [];
        }
      }
    }
  }

  private entryFor(poke: LedgerPokemonLike): LedgerEntry {
    const ident = poke.originalIdent || poke.ident || '';
    const key = ledgerKey(sideIdOf(poke), ident);
    let entry = this.entries.get(key);
    if (!entry) {
      const hp = num(poke.hp, 0);
      const maxhp = num(poke.maxhp, 100) || 100;
      entry = { key, turn: this.turn, startHp: hp, startMaxhp: maxhp, hp, maxhp, events: [] };
      this.entries.set(key, entry);
    }
    return entry;
  }
}
