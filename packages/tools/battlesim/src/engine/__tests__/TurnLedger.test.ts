import { describe, expect, it } from 'vitest';
import { Protocol } from '@pkmn/protocol';
import { TurnLedger, ledgerKey } from '../TurnLedger';
import { makeBattle, OPENING } from './helpers';

/** Exactly what the processor does: `battle.add` first, then record. */
function run(lines: string[]) {
  const battle = makeBattle();
  const ledger = new TurnLedger();
  for (const line of lines) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    battle.add(args, kwArgs);
    ledger.record(args, kwArgs as any, battle);
  }
  return { battle, ledger };
}

const PIKA = ledgerKey('p1', 'p1: Pikachu');
const RHY = ledgerKey('p2', 'p2: Rhydon');

describe('TurnLedger', () => {
  it('records damage against the turn baseline', () => {
    const { ledger } = run([...OPENING, '|-damage|p2a: Rhydon|180/250']);
    const entry = ledger.getByKey(RHY)!;
    expect(entry.startHp).toBe(250);
    expect(entry.hp).toBe(180);
    expect(ledger.lostThisTurn(entry)).toBe(70);
    expect(entry.events).toEqual([
      { kind: 'damage', from: 250, to: 180, maxhp: 250, source: undefined, turn: 1 },
    ]);
  });

  it('records heals', () => {
    const { ledger } = run([
      ...OPENING,
      '|-damage|p1a: Pikachu|120/200',
      '|turn|2',
      '|-heal|p1a: Pikachu|170/200',
    ]);
    const entry = ledger.getByKey(PIKA)!;
    expect(entry.startHp).toBe(120);
    expect(entry.hp).toBe(170);
    expect(ledger.gainedThisTurn(entry)).toBe(50);
    expect(entry.events.map(e => e.kind)).toEqual(['heal']);
  });

  it('keeps both hits of a multi-hit move', () => {
    const { ledger } = run([
      ...OPENING,
      '|move|p1a: Pikachu|Bullet Seed|p2a: Rhydon',
      '|-damage|p2a: Rhydon|220/250',
      '|-damage|p2a: Rhydon|195/250',
      '|-hitcount|p2a: Rhydon|2',
    ]);
    const entry = ledger.getByKey(RHY)!;
    expect(entry.events).toHaveLength(2);
    expect(entry.events.map(e => [e.from, e.to])).toEqual([[250, 220], [220, 195]]);
    expect(ledger.lostThisTurn(entry)).toBe(55);
  });

  it('attributes residual damage to its source, after the move', () => {
    const { ledger } = run([
      ...OPENING,
      '|move|p1a: Pikachu|Thunderbolt|p2a: Rhydon',
      '|-damage|p2a: Rhydon|200/250',
      '|-damage|p1a: Pikachu|188/200|[from] psn',
    ]);
    const pika = ledger.getByKey(PIKA)!;
    expect(pika.events).toHaveLength(1);
    expect(pika.events[0].source).toBe('psn');
    expect(pika.events[0].kind).toBe('damage');
    expect(ledger.lostThisTurn(pika)).toBe(12);
  });

  it('keeps damage and heal apart in the same turn', () => {
    const { ledger } = run([
      ...OPENING,
      '|-damage|p1a: Pikachu|140/200',
      '|-heal|p1a: Pikachu|165/200|[from] item: Leftovers',
    ]);
    const entry = ledger.getByKey(PIKA)!;
    expect(entry.events.map(e => e.kind)).toEqual(['damage', 'heal']);
    expect(ledger.lostThisTurn(entry)).toBe(35);
    expect(ledger.gainedThisTurn(entry)).toBe(0);
    expect(entry.events[1].source).toBe('item: Leftovers');
  });

  it('records -sethp', () => {
    const { ledger } = run([...OPENING, '|-sethp|p1a: Pikachu|100/200']);
    const entry = ledger.getByKey(PIKA)!;
    expect(entry.events[0].kind).toBe('sethp');
    expect(entry.hp).toBe(100);
  });

  it('re-baselines a Pokemon that switches in mid-turn', () => {
    const { ledger } = run([
      ...OPENING,
      '|-damage|p1a: Pikachu|150/200',
      '|switch|p1a: Bulbasaur|Bulbasaur, L50, M|160/160',
      '|switch|p1a: Pikachu|Pikachu, L50, M|150/200',
    ]);
    const bulba = ledger.getByKey(ledgerKey('p1', 'p1: Bulbasaur'))!;
    expect(bulba.startHp).toBe(160);
    expect(ledger.lostThisTurn(bulba)).toBe(0);
    expect(bulba.events.map(e => e.kind)).toEqual(['switchin']);

    // Pikachu re-enters at 150: what it lost BEFORE it left is not this turn's.
    const pika = ledger.getByKey(PIKA)!;
    expect(pika.startHp).toBe(150);
    expect(pika.hp).toBe(150);
    expect(ledger.lostThisTurn(pika)).toBe(0);
    expect(pika.events.map(e => e.kind)).toEqual(['switchin']);
  });

  it('takes a fainted Pokemon to 0', () => {
    const { ledger } = run([
      ...OPENING,
      '|-damage|p2a: Rhydon|0 fnt',
      '|faint|p2a: Rhydon',
    ]);
    const entry = ledger.getByKey(RHY)!;
    expect(entry.hp).toBe(0);
    expect(entry.events.map(e => e.kind)).toEqual(['damage', 'faint']);
    expect(ledger.lostThisTurn(entry)).toBe(250);
  });

  it('snapshots every Pokemon on a new turn and clears its events', () => {
    const { ledger } = run([
      ...OPENING,
      '|-damage|p2a: Rhydon|180/250',
      '|turn|2',
    ]);
    expect(ledger.turn).toBe(2);
    const entry = ledger.getByKey(RHY)!;
    expect(entry.events).toEqual([]);
    expect(entry.startHp).toBe(180);
    expect(ledger.lostThisTurn(entry)).toBe(0);
  });

  it('starts at turn 0 and resets', () => {
    const { ledger } = run(['|player|p1|Alice|1|']);
    expect(ledger.turn).toBe(0);
    ledger.reset();
    expect(ledger.all()).toEqual([]);
  });
});
