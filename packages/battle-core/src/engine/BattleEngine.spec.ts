import { describe, it, expect } from 'vitest';

import { BattleEngine, type BattleViewer } from './BattleEngine.js';
import { getRandomTeam } from '../teams/random.js';

/**
 * These drive a REAL `@pkmn/sim` battle. Nothing here mocks the simulator,
 * because the thing under test is precisely how the simulator's per-viewer
 * streams behave — visibility and ordering are its rules, not ours, and a mock
 * would only assert that we agree with our own assumptions.
 */

interface Recorded {
  viewer: BattleViewer;
  line: string;
  /** Position in the interleaved delivery order, across all viewers. */
  at: number;
}

interface Harness {
  engine: BattleEngine;
  lines: Recorded[];
  errors: string[];
  ended: { winner: string; log: string } | null;
  of(viewer: BattleViewer): string[];
}

function makeEngine(mode: 'pvp' | 'ai' = 'pvp'): Harness {
  let at = 0;
  const harness: Harness = {
    engine: undefined as unknown as BattleEngine,
    lines: [],
    errors: [],
    ended: null,
    of(viewer) {
      return harness.lines.filter((l) => l.viewer === viewer).map((l) => l.line);
    },
  };
  harness.engine = new BattleEngine(
    'test',
    {
      onLine: (viewer, line) => harness.lines.push({ viewer, line, at: at++ }),
      onBattleEnd: (result) => {
        harness.ended = { winner: result.winner, log: result.log };
      },
      onError: (message) => harness.errors.push(message),
    },
    mode,
  );
  return harness;
}

/** Lets the simulator's async stream plumbing drain. */
const settle = async (turns = 40) => {
  for (let i = 0; i < turns; i++) await new Promise((resolve) => setImmediate(resolve));
};

const lastRequest = (lines: string[]): string | undefined =>
  [...lines].reverse().find((line) => line.startsWith('|request|'));

const rqidOf = (line: string): number => JSON.parse(line.slice('|request|'.length)).rqid;

async function startPvp(): Promise<Harness> {
  const harness = makeEngine('pvp');
  await harness.engine.create(
    'gen9randombattle',
    { name: 'Alice', team: getRandomTeam('gen9randombattle') },
    { name: 'Bob', team: getRandomTeam('gen9randombattle') },
  );
  await settle();
  return harness;
}

describe('BattleEngine — one ordered stream per viewer', () => {
  it('gives p1, p2 and the spectator their own lines', async () => {
    const harness = await startPvp();

    expect(harness.errors).toEqual([]);
    expect(harness.of('p1').length).toBeGreaterThan(0);
    expect(harness.of('p2').length).toBeGreaterThan(0);
    expect(harness.of('spectator').length).toBeGreaterThan(0);

    // Requests are side-private: they appear on a side's own stream and never
    // on the spectator's.
    expect(harness.of('p1').some((l) => l.startsWith('|request|'))).toBe(true);
    expect(harness.of('p2').some((l) => l.startsWith('|request|'))).toBe(true);
    expect(harness.of('spectator').some((l) => l.startsWith('|request|'))).toBe(false);
  }, 60_000);

  it("delivers each |request| AFTER that turn's protocol lines on the same stream", async () => {
    const harness = await startPvp();

    // Play several turns so there is a real turn boundary to order against.
    for (let turn = 0; turn < 4; turn++) {
      for (const side of ['p1', 'p2'] as const) {
        const line = lastRequest(harness.of(side));
        if (!line) continue;
        const request = JSON.parse(line.slice('|request|'.length));
        if (request.wait) continue;
        const choice = request.forceSwitch ? 'switch 2' : 'default';
        await harness.engine.makeChoice(side, choice, request.rqid);
      }
      await settle();
      if (harness.ended) break;
    }

    const p1 = harness.lines.filter((l) => l.viewer === 'p1');
    const turnMarks = p1.filter((l) => l.line.startsWith('|turn|'));
    expect(turnMarks.length).toBeGreaterThan(1);

    // For every `|turn|N`, the request that answers it comes later in the SAME
    // stream — never before the lines that produced it. That was the whole
    // point of moving requests into the stream: the old code read them from a
    // second, independent loop whose interleaving with `onProtocol` was
    // whatever the event loop felt like.
    for (const mark of turnMarks) {
      const request = p1.find((l) => l.at > mark.at && l.line.startsWith('|request|'));
      if (!request) continue;
      const nextTurn = turnMarks.find((t) => t.at > mark.at);
      expect(request.at).toBeGreaterThan(mark.at);
      if (nextTurn) expect(request.at).toBeLessThan(nextTurn.at);
    }

    // And within one viewer, `at` is strictly increasing: one call per line, in
    // stream order.
    const ats = p1.map((l) => l.at);
    expect([...ats].sort((a, b) => a - b)).toEqual(ats);
  }, 60_000);

  it("hides p1's exact HP from p2 via |split| semantics", async () => {
    const harness = await startPvp();

    // Force damage so there is an HP line to compare at all.
    for (let turn = 0; turn < 6 && !harness.ended; turn++) {
      for (const side of ['p1', 'p2'] as const) {
        const line = lastRequest(harness.of(side));
        if (!line) continue;
        const request = JSON.parse(line.slice('|request|'.length));
        if (request.wait) continue;
        await harness.engine.makeChoice(
          side,
          request.forceSwitch ? 'switch 2' : 'default',
          request.rqid,
        );
      }
      await settle();
    }

    // The same event, seen from both sides. p1 gets `current/maxhp`; p2 gets
    // `current/100` — Showdown's percentage. That difference IS the `|split|`
    // rule, and it is why the omniscient stream must never be broadcast.
    const hpOf = (line: string): [number, number] | null => {
      const match = /\|(\d+)\/(\d+)/.exec(line);
      return match ? [Number(match[1]), Number(match[2])] : null;
    };
    const about = (lines: string[], ident: string) =>
      lines.filter((l) => /^\|(switch|-damage|-heal)\|/.test(l) && l.includes(`|${ident}:`));

    const ownP1 = about(harness.of('p1'), 'p1a');
    const foreignP1 = about(harness.of('p2'), 'p1a');
    expect(ownP1.length).toBeGreaterThan(0);
    expect(foreignP1.length).toBeGreaterThan(0);

    // p2 only ever sees p1's Pokémon out of 100.
    for (const line of foreignP1) {
      const hp = hpOf(line);
      if (hp) expect(hp[1]).toBe(100);
    }
    // p1 sees its own out of the real maximum, which is not 100.
    expect(ownP1.some((l) => (hpOf(l)?.[1] ?? 100) !== 100)).toBe(true);

    // Symmetric: p1 does not get p2's exact HP either.
    for (const line of about(harness.of('p1'), 'p2a')) {
      const hp = hpOf(line);
      if (hp) expect(hp[1]).toBe(100);
    }

    // No `|split|` marker survives to a viewer; the streams resolve them.
    for (const viewer of ['p1', 'p2', 'spectator'] as const) {
      expect(harness.of(viewer).some((l) => l.startsWith('|split|'))).toBe(false);
    }
  }, 60_000);
});

describe('BattleEngine — rqid validation', () => {
  it('refuses a choice whose rqid is not the current request', async () => {
    const harness = await startPvp();
    const line = lastRequest(harness.of('p1'))!;
    const rqid = rqidOf(line);

    const stale = await harness.engine.makeChoice('p1', 'default', rqid - 1);
    expect(stale).toEqual({ ok: false, code: 'stale_choice' });

    const fresh = await harness.engine.makeChoice('p1', 'default', rqid);
    expect(fresh).toEqual({ ok: true });
  }, 60_000);

  it('refuses the SAME choice twice', async () => {
    const harness = await startPvp();
    const rqid = rqidOf(lastRequest(harness.of('p1'))!);

    expect(await harness.engine.makeChoice('p1', 'default', rqid)).toEqual({ ok: true });
    // A double click, or a choice re-sent after a reconnect.
    expect(await harness.engine.makeChoice('p1', 'default', rqid)).toEqual({
      ok: false,
      code: 'stale_choice',
    });
  }, 60_000);

  it('accepts a choice with no rqid at all (the local worker never had one)', async () => {
    const harness = await startPvp();
    expect(await harness.engine.makeChoice('p1', 'default')).toEqual({ ok: true });
  }, 60_000);

  it('reports no_request when the side has not been asked anything', async () => {
    const harness = await startPvp();
    const rqid = rqidOf(lastRequest(harness.of('p1'))!);
    await harness.engine.makeChoice('p1', 'default', rqid);
    await harness.engine.makeChoice('p2', 'default', rqidOf(lastRequest(harness.of('p2'))!));
    await settle();

    // Both sides answered; the engine is between requests for neither. Undo on
    // a side with nothing outstanding is the reachable version of this.
    const result = await harness.engine.undoChoice('p1');
    expect(result.ok).toBe(false);
  }, 60_000);
});

describe('BattleEngine — endings', () => {
  it('fires onBattleEnd once, after |win| reached every stream', async () => {
    const harness = await startPvp();
    await harness.engine.forfeit('p1');
    await settle(80);

    expect(harness.ended).not.toBeNull();
    expect(harness.ended!.winner).toBe('Bob');
    expect(harness.ended!.log.length).toBeGreaterThan(0);

    for (const viewer of ['p1', 'p2', 'spectator'] as const) {
      const wins = harness.of(viewer).filter((l) => l.startsWith('|win|'));
      // Exactly one win line per viewer — no duplicate ending.
      expect(wins).toHaveLength(1);
    }

    // A second forfeit is a no-op, not a second ending.
    await harness.engine.forfeit('p2');
    await settle();
    expect(harness.of('p1').filter((l) => l.startsWith('|win|'))).toHaveLength(1);
  }, 60_000);

  it('does not throw when a battle that never started is forfeited', async () => {
    const harness = makeEngine('pvp');
    await expect(harness.engine.forfeit('p1')).resolves.toBeUndefined();
    expect(harness.ended).toEqual({ winner: 'p2', log: '' });
    expect(harness.errors).toEqual([]);
  });

  it('refuses a choice once the battle is over', async () => {
    const harness = await startPvp();
    await harness.engine.forfeit('p1');
    await settle(80);
    expect(await harness.engine.makeChoice('p1', 'default')).toEqual({
      ok: false,
      code: 'battle_over',
    });
  }, 60_000);
});

describe('BattleEngine — ai mode', () => {
  it('leaves the p2 stream to the bot and only surfaces p1 and the spectator', async () => {
    const harness = makeEngine('ai');
    await harness.engine.create('gen9randombattle');
    await settle();

    expect(harness.of('p1').length).toBeGreaterThan(0);
    expect(harness.of('spectator').length).toBeGreaterThan(0);
    // Reading p2 here would race the RandomPlayerAI for the same chunks.
    expect(harness.of('p2')).toHaveLength(0);
    expect(harness.errors).toEqual([]);
  }, 60_000);
});
