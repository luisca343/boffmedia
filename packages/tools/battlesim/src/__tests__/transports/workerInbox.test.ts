/**
 * The local-AI transport: what a worker message does to a session.
 *
 * The one that matters is `battleEnd`. It used to synthesise a `|win|` line of
 * its own on top of the real one the engine had already sent (C4), so the end
 * fired twice: the end screen appeared, and then the queue caught up and played
 * the last turn out underneath it.
 */

import { describe, expect, it, vi } from 'vitest';

import { applyWorkerEvent } from '../../play/workerInbox';
import { BattleSession } from '../../engine/BattleSession';
import { OPENING, makeField, makeSpy, settle, waitFor } from '../../engine/__tests__/helpers';

function makeSession() {
  const spy = makeSpy();
  const session = new BattleSession('local-1', spy.callbacks);
  session.setAcceleration(8);
  session.setViewerSide('p1');
  session.initScene(makeField(), 0);
  return { session, spy };
}

async function drain(session: BattleSession) {
  await waitFor(() => !(session as any).processing && (session as any).lineBuffer.length === 0);
  await settle(5);
}

describe('workerInbox — battleEnd', () => {
  it('does not add a second |win|', async () => {
    const { session, spy } = makeSession();

    const lines = [...OPENING, '|faint|p2a: Rhydon', '|win|Player'];
    lines.forEach((line, seq) => applyWorkerEvent(session, { type: 'protocol', roomId: 'local-1', seq, line }));
    await drain(session);

    expect(spy.ends).toEqual(['Player']);
    expect(session.battleComplete).toBe(true);

    applyWorkerEvent(session, {
      type: 'battleEnd',
      roomId: 'local-1',
      seq: lines.length - 1,
      winner: 'Player',
      log: lines.join('\n'),
      teams: null,
    });
    await drain(session);

    // Once. The engine owns `|win|`; the transport owns only the bookkeeping.
    expect(spy.ends).toEqual(['Player']);
    expect(session.htmlLog.filter((h) => /won the battle|Player/i.test(h)).length).toBeLessThanOrEqual(2);
    expect(session.winner).toBe('Player');
  });

  it('does not end the battle before the queue has played it out', async () => {
    const { session, spy } = makeSession();

    // Exactly the real ordering: the worker posts `battleEnd` the moment its
    // engine finishes, which is while the last turn is still queued here.
    const lines = [...OPENING, '|faint|p2a: Rhydon', '|win|Player'];
    lines.forEach((line, seq) => applyWorkerEvent(session, { type: 'protocol', roomId: 'local-1', seq, line }));
    applyWorkerEvent(session, {
      type: 'battleEnd',
      roomId: 'local-1',
      seq: lines.length,
      winner: 'Player',
      log: lines.join('\n'),
      teams: null,
    });

    // The end screen is `battleComplete || status === 'finished'`, so BOTH
    // have to still be un-ended here or it paints over the last turn.
    expect(session.battleComplete).toBe(false);
    expect(session.status).not.toBe('finished');
    expect(spy.ends).toEqual([]);

    // ...and the bookkeeping the transport DOES own arrived immediately.
    expect(session.winner).toBe('Player');
    expect(session.replay).toBe(lines.join('\n'));

    await drain(session);
    expect(session.battleComplete).toBe(true);
    expect(spy.ends).toEqual(['Player']);
  });

  it('hands the replay log to the caller exactly once', () => {
    const { session } = makeSession();
    const onEnd = vi.fn();
    applyWorkerEvent(
      session,
      { type: 'battleEnd', roomId: 'local-1', seq: 3, winner: 'Bot', log: 'x', teams: null },
      { onEnd },
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(session.isWaitingForChoice).toBe(false);
    expect(session.currentRequest).toBeNull();
  });
});

describe('workerInbox — frames', () => {
  it('drops a duplicate frame instead of applying it twice', async () => {
    const { session } = makeSession();
    OPENING.forEach((line, seq) => applyWorkerEvent(session, { type: 'protocol', roomId: 'local-1', seq, line }));
    await drain(session);

    const frame = { type: 'protocol' as const, roomId: 'local-1', seq: OPENING.length, line: '|-damage|p2a: Rhydon|200/250' };
    applyWorkerEvent(session, frame);
    await drain(session);
    applyWorkerEvent(session, frame);
    await drain(session);

    expect(session.battle.p2.active[0]!.hp).toBe(200);
  });

  it('prompts once for a request that arrives inline', async () => {
    const { session, spy } = makeSession();
    const request = `|request|${JSON.stringify({ rqid: 1, active: [{ moves: [] }], side: { id: 'p1', name: 'Player', pokemon: [] } })}`;
    [...OPENING, request].forEach((line, seq) =>
      applyWorkerEvent(session, { type: 'protocol', roomId: 'local-1', seq, line }),
    );
    await drain(session);
    expect(spy.requests).toHaveLength(1);
  });

  it('warns rather than crashing on the retired `request` message', () => {
    const { session, spy } = makeSession();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyWorkerEvent(session, { type: 'request', roomId: 'local-1', request: {} });
    expect(warn).toHaveBeenCalled();
    expect(spy.requests).toHaveLength(0);
    warn.mockRestore();
  });
});

describe('workerInbox — errors', () => {
  it('re-opens the dock on a refused choice instead of killing the battle', () => {
    const { session } = makeSession();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    session.isWaitingForChoice = true;

    applyWorkerEvent(session, { type: 'error', roomId: 'local-1', message: 'stale', code: 'stale_choice' });

    expect(session.status).not.toBe('error');
    expect(session.error).toBeNull();
    expect(session.isWaitingForChoice).toBe(false);
    warn.mockRestore();
  });

  it('does report a real failure', () => {
    const { session } = makeSession();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    applyWorkerEvent(session, { type: 'error', roomId: 'local-1', message: 'boom' });
    expect(session.status).toBe('error');
    expect(session.error).toBe('boom');
    warn.mockRestore();
  });
});

describe('local transport — the viewer side', () => {
  it('is stated outright, and a canvas remount cannot flip it', async () => {
    const { session } = makeSession();
    OPENING.forEach((line, seq) => applyWorkerEvent(session, { type: 'protocol', roomId: 'local-1', seq, line }));
    await drain(session);

    // `initScene(el, 1)` is the "guess" a remount would pass; an explicit side
    // outranks it.
    session.initScene(makeField(), 1);
    expect((session as any).pov).toBe(0);
  });
});
