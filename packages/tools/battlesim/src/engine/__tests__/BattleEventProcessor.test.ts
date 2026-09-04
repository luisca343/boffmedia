import { describe, expect, it, vi } from 'vitest';
import { BattleEventProcessor } from '../BattleEventProcessor';
import { Scene } from '../Scene';
import { TurnLedger } from '../TurnLedger';
import { eventHandlers, getDefaultTimeout, noAnimEvents } from '../eventHandlers';
import { makeBattle, makeField, OPENING } from './helpers';

function makeProcessor(acceleration = 8) {
  const battle = makeBattle();
  const scene = new Scene(battle, makeField());
  scene.setAcceleration(acceleration);
  const ledger = new TurnLedger();
  const processor = new BattleEventProcessor({ scene, battle, pov: 0, ledger });
  return { processor, scene, battle, ledger };
}

describe('BattleEventProcessor', () => {
  it('gives every no-animation line 0 ms and no handler', async () => {
    const { processor } = makeProcessor();
    const lines = [
      '|c|☆Alice|gg',
      '|c:|1700000000|☆Alice|gg',
      '|j|Alice',
      '|l|Alice',
      '|n|Alice|alice',
      '|upkeep',
      '|inactiveoff|Timer off',
      '|-hint|Something',
      '|-message|Whatever',
      '|t:|1700000000',
    ];
    for (const line of lines) {
      const event = await processor.processLine(line);
      expect(await processor.runAnimation(event), line).toBe(0);
    }
    // Everything above is claimed by the set, not by a handler that happens
    // to return 0 — a handler would still have paid the 300 ms default.
    for (const line of lines) {
      const type = line.split('|')[1];
      expect(noAnimEvents.has(type), type).toBe(true);
      expect(eventHandlers[type]).toBeUndefined();
    }
  });

  it('falls back to the default timeout for an unclaimed event', async () => {
    const { processor } = makeProcessor(1);
    const event = await processor.processLine('|-mustrecharge|p1a: Pikachu');
    expect(await processor.runAnimation(event)).toBe(getDefaultTimeout(1));
  });

  it('applies acceleration to the default timeout', () => {
    expect(getDefaultTimeout(2)).toBe(getDefaultTimeout(1) / 2);
  });

  it('records the ledger after battle.add', async () => {
    const { processor, ledger, battle } = makeProcessor();
    for (const line of [...OPENING, '|-damage|p2a: Rhydon|180/250']) {
      const event = await processor.processLine(line);
      await processor.runAnimation(event);
    }
    const entry = ledger.get(battle.p2!.active[0] as any)!;
    expect(entry.hp).toBe(180);
    expect(ledger.lostThisTurn(entry)).toBe(70);
  });

  it('keeps going when a handler throws, and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { processor, battle } = makeProcessor();
    const original = eventHandlers['-damage'].postApply!;
    eventHandlers['-damage'].postApply = async () => { throw new Error('boom'); };
    try {
      for (const line of OPENING) {
        const event = await processor.processLine(line);
        await processor.runAnimation(event);
      }
      const event = await processor.processLine('|-damage|p2a: Rhydon|180/250');
      // The state still landed even though the animation blew up.
      expect((battle.p2!.active[0] as any).hp).toBe(180);
      expect(await processor.runAnimation(event)).toBe(0);
      expect(warn).toHaveBeenCalled();
    } finally {
      eventHandlers['-damage'].postApply = original;
      warn.mockRestore();
    }
  });

  it('logs a bad line with the line itself and keeps the pipeline alive', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { processor, battle } = makeProcessor();
    // A switch for a side the battle has never heard of.
    await processor.processLine('|-damage|p9z: Nobody|10/100');
    const event = await processor.processLine('|player|p1|Alice|1|');
    expect(await processor.runAnimation(event)).toBe(0);
    expect(battle.p1!.name).toBe('Alice');
    warn.mockRestore();
  });

  it('applySync rebuilds state with no animation and no awaiting', () => {
    const { processor, battle, ledger } = makeProcessor(1);
    for (const line of [...OPENING, '|-damage|p2a: Rhydon|180/250']) {
      processor.applySync(line);
    }
    expect(battle.turn).toBe(1);
    expect((battle.p2!.active[0] as any).hp).toBe(180);
    expect(ledger.get(battle.p2!.active[0] as any)!.hp).toBe(180);
  });

  it('rebinds its scene without losing the formatter it trained', async () => {
    const { processor, battle } = makeProcessor();
    for (const line of OPENING) await processor.processLine(line);
    processor.setScene(new Scene(battle, makeField()));
    // A rebuilt LogFormatter has never seen the |player| lines, so this reads
    // "Player 2 sent out ..." instead of the trainer's name.
    const event = await processor.processLine('|switch|p2a: Snorlax|Snorlax, L50, M|300/300');
    expect(event.html).toContain('Bob');
  });
});
