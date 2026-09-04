import { describe, expect, it, vi } from 'vitest';
import { BattleSession } from '../BattleSession';
import { OPENING, feed, makeField, makeSession, makeSpy, settle, waitFor } from './helpers';

const SWITCH_IN = '|switch|p1a: Bulbasaur|Bulbasaur, L50, M|160/160';

function request(rqid: number, extra: Record<string, unknown> = {}) {
  return { rqid, active: [{ moves: [] }], side: { id: 'p1', name: 'Alice', pokemon: [] }, ...extra } as any;
}

describe('BattleSession — switch sequence', () => {
  it('recalls the OUTGOING Pokemon before the state changes, then summons after the commit', async () => {
    const order: string[] = [];
    let committed = false;
    const spy = makeSpy();
    const session = new BattleSession('room-switch', spy.callbacks);
    // Real speed: the recall/summon halves only exist when animations play.
    session.setAcceleration(1);
    session.initScene(makeField(), 0);
    const scene = session.scene!;

    // Who is standing in p1a when each half runs? That is the whole question.
    const occupant = () => (session.battle.p1?.active?.[0] as any)?.name ?? 'none';
    scene.playRecall = async (code: string) => { order.push(`recall:${code}:${occupant()}`); };
    scene.playSummon = async (code: string) => { order.push(`summon:${code}:${occupant()}:committed=${committed}`); };
    const clear = vi.fn(async () => {});
    scene.clearPokemonElement = clear;
    scene.playFaint = async () => {};
    scene.playBattleAnim = async () => {};
    scene.showPopup = async () => {};
    scene.showBanner = async () => {};

    const realAwait = session.awaitCommit.bind(session);
    session.awaitCommit = () => {
      order.push('commit');
      const p = realAwait();
      // The canvas answers from a layout effect; here, one tick later.
      setTimeout(() => { committed = true; session.onCommitted(session.revision); }, 0);
      return p;
    };

    await feed(session, OPENING);
    order.length = 0;
    await feed(session, [SWITCH_IN]);

    expect(order[0]).toBe('recall:p1a:Pikachu');
    expect(order[1]).toBe('commit');
    expect(order[2]).toBe('summon:p1a:Bulbasaur:committed=true');
    // The old sprite is never reset to opacity 1 once the new mon holds the slot.
    expect(clear).not.toHaveBeenCalled();
    session.destroy();
  });

  it('bumps the slot generation so a queued animation on the old mon is abandoned', async () => {
    const { session } = makeSession({ acceleration: 1 });
    const scene = session.scene!;
    scene.playRecall = async () => {};
    scene.playSummon = async () => {};
    await feed(session, OPENING);
    const before = scene.slotGeneration('p1a');
    const token = scene.token('p1a');
    await feed(session, [SWITCH_IN]);
    expect(scene.slotGeneration('p1a')).toBeGreaterThan(before);
    expect(scene.isStale(token)).toBe(true);
    session.destroy();
  });

  it('does not recall a Pokemon that has already fainted, but still summons', async () => {
    const { session } = makeSession({ acceleration: 1 });
    const scene = session.scene!;
    const recall = vi.fn(async () => {});
    const summon = vi.fn(async () => {});
    scene.playRecall = recall;
    scene.playSummon = summon;
    scene.playFaint = async () => {};
    await feed(session, OPENING);
    await feed(session, ['|-damage|p1a: Pikachu|0 fnt', '|faint|p1a: Pikachu']);
    recall.mockClear();
    await feed(session, [SWITCH_IN]);
    expect(recall).not.toHaveBeenCalled();
    expect(summon).toHaveBeenCalledWith('p1a');
    session.destroy();
  });

  it('does not recall on |replace| (an Illusion reveal is the same body)', async () => {
    const { session } = makeSession({ acceleration: 1 });
    const scene = session.scene!;
    const recall = vi.fn(async () => {});
    scene.playRecall = recall;
    scene.playSummon = async () => {};
    await feed(session, OPENING);
    await feed(session, ['|replace|p1a: Zoroark|Zoroark, L50, M|200/200']);
    expect(recall).not.toHaveBeenCalled();
    session.destroy();
  });
});

describe('BattleSession — request queue', () => {
  it('promotes only the latest of three requests that arrive before the drain', async () => {
    const { session, spy } = makeSession();
    // The lines are still draining, which is when a pile-up actually happens:
    // a resync replay, a PS re-send, a spectator becoming a player.
    for (const line of OPENING) session.addLine(line);
    session.handleRequest(request(1));
    session.handleRequest(request(2));
    session.handleRequest(request(3));

    await waitFor(() => spy.requests.length > 0);
    await settle(10);

    // The dock must never be offered a move list for a turn already passed.
    expect(spy.requests.map(r => r.rqid)).toEqual([3]);
    expect(session.currentRequest && (session.currentRequest as any).rqid).toBe(3);
    expect(session.pendingRequests).toHaveLength(0);

    session.resumeAfterChoice();
    await settle(10);
    expect(spy.requests.map(r => r.rqid)).toEqual([3]);
    session.destroy();
  });

  it('supersedes an unanswered request that is already on the dock', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    session.handleRequest(request(1));
    await settle(5);
    expect(session.currentRequest && (session.currentRequest as any).rqid).toBe(1);

    session.handleRequest(request(2));
    await settle(5);
    expect(spy.requests.map(r => r.rqid)).toEqual([1, 2]);
    expect(session.currentRequest && (session.currentRequest as any).rqid).toBe(2);
    expect(session.pendingRequests).toHaveLength(0);
    session.destroy();
  });

  it('ignores a stale re-delivery of an older rqid', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    session.handleRequest(request(5));
    session.handleRequest(request(4));
    await settle(5);
    expect(spy.requests.map(r => r.rqid)).toEqual([5]);
    expect(session.pendingRequests).toHaveLength(0);
    session.destroy();
  });

  it('ignores a duplicate rqid', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    session.handleRequest(request(7));
    session.handleRequest(request(7));
    await settle(5);
    expect(spy.requests).toHaveLength(1);
    expect(session.pendingRequests).toHaveLength(0);
    session.destroy();
  });

  it('ignores a wait request', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    session.handleRequest({ wait: true, rqid: 3 } as any);
    await settle(5);
    expect(spy.requests).toHaveLength(0);
    session.destroy();
  });

  it('reads |request| lines out of the stream', async () => {
    const { session, spy } = makeSession();
    await feed(session, [...OPENING, `|request|${JSON.stringify(request(11))}`]);
    expect(spy.requests.map(r => r.rqid)).toEqual([11]);
    session.destroy();
  });

  it('warns instead of silently dropping malformed request JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { session, spy } = makeSession();
    await feed(session, [...OPENING, '|request|{not json']);
    expect(spy.requests).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    session.destroy();
  });

  it('sends the rqid with the choice', async () => {
    const { session } = makeSession();
    await feed(session, OPENING);
    session.handleRequest(request(42));
    await settle(5);
    const emitted: any[] = [];
    session.makeChoice('move 1', { emit: (event, payload) => emitted.push([event, payload]) });
    expect(emitted).toEqual([['makeChoice', { roomId: 'room-1', choice: 'move 1', rqid: 42 }]]);
    session.destroy();
  });
});

describe('BattleSession — framing', () => {
  it('drops a duplicate seq and reports a gap', async () => {
    const spy = makeSpy();
    const { session } = makeSession({ spy });
    expect(session.acceptFrame(0, OPENING[0])).toBe(true);
    expect(session.acceptFrame(1, OPENING[1])).toBe(true);
    expect(session.acceptFrame(1, OPENING[1])).toBe(false);
    expect(session.acceptFrame(0, OPENING[0])).toBe(false);
    expect(spy.gaps).toEqual([]);
    expect(session.acceptFrame(5, OPENING[2])).toBe(true);
    expect(spy.gaps).toEqual([[1, 5]]);
    expect(session.sequence).toBe(5);
    await settle(5);
    session.destroy();
  });

  it('behaves like addLine when the transport does not number frames', async () => {
    const { session } = makeSession();
    for (const line of OPENING) expect(session.acceptFrame(undefined, line)).toBe(true);
    await waitFor(() => session.battle.turn === 1);
    expect(session.sequence).toBe(-1);
    session.destroy();
  });
});

describe('BattleSession — resync', () => {
  const LOG = [
    ...OPENING,
    '|move|p1a: Pikachu|Thunderbolt|p2a: Rhydon',
    '|-damage|p2a: Rhydon|180/250',
    '|turn|2',
  ];

  it('is idempotent: the same lines twice give the same state and log', async () => {
    const { session } = makeSession();
    session.resync(LOG, { seq: 12 });
    const hp = (session.battle.p2!.active[0] as any).hp;
    const logLength = session.htmlLog.length;
    expect(hp).toBe(180);
    expect(session.battle.turn).toBe(2);
    expect(session.sequence).toBe(12);

    session.resync(LOG, { seq: 12 });
    expect((session.battle.p2!.active[0] as any).hp).toBe(180);
    expect(session.battle.turn).toBe(2);
    expect(session.htmlLog.length).toBe(logLength);
    expect(session.ledger.all().length).toBeGreaterThan(0);
    session.destroy();
  });

  it('does not double-apply a log the session already followed', async () => {
    const { session } = makeSession();
    await feed(session, LOG);
    expect((session.battle.p2!.active[0] as any).hp).toBe(180);
    const logLength = session.htmlLog.length;

    session.resync(LOG);
    expect((session.battle.p2!.active[0] as any).hp).toBe(180);
    expect(session.htmlLog.length).toBe(logLength);
    session.destroy();
  });

  it('re-prompts the pending request carried in the log', async () => {
    const { session, spy } = makeSession();
    session.resync([...LOG, `|request|${JSON.stringify(request(9))}`]);
    await settle(5);
    expect(spy.requests.map(r => r.rqid)).toEqual([9]);
    session.destroy();
  });
});

describe('BattleSession — resync races an in-flight line', () => {
  it('drops a line that was mid-flight when the rebuild landed', async () => {
    const { session } = makeSession();
    await feed(session, OPENING);

    // Not drained: `processLine` is parked on its first await.
    session.addLine('|-damage|p2a: Rhydon|180/250');
    session.resync(OPENING, { seq: 4 });
    await settle(20);

    // The abandoned line must not have appended to the rebuilt log.
    expect(session.htmlLog.length).toBe(OPENING.length);
    expect((session.battle.p2!.active[0] as any).hp).toBe(250);
    session.destroy();
  });

  it('drops a line that was mid-flight when the session was destroyed', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    const logLength = session.htmlLog.length;
    const updates = spy.updates;

    session.addLine('|turn|2');
    session.destroy();
    await settle(20);

    expect(session.htmlLog.length).toBe(logLength);
    expect(spy.updates).toBe(updates);
  });
});

describe('BattleSession — resync without a canvas', () => {
  it('rebuilds on a session that has never mounted, and applies on initScene', async () => {
    const spy = makeSpy();
    const session = new BattleSession('room-headless', spy.callbacks);
    session.setAcceleration(8);

    session.resync(OPENING, { seq: 7 });
    expect(session.sequence).toBe(7);

    session.initScene(makeField(), 0);
    await settle(10);

    expect(session.battle.turn).toBe(1);
    expect((session.battle.p1!.active[0] as any).name).toBe('Pikachu');
    expect(session.htmlLog.length).toBe(OPENING.length);
    expect(session.ledger.all().length).toBeGreaterThan(0);
    session.destroy();
  });

  it('re-prompts a request carried by a pre-mount resync', async () => {
    const spy = makeSpy();
    const session = new BattleSession('room-headless-req', spy.callbacks);
    session.setAcceleration(8);
    session.resync([...OPENING, `|request|${JSON.stringify(request(21))}`]);
    expect(spy.requests).toHaveLength(0);

    session.initScene(makeField(), 0);
    await settle(10);
    expect(spy.requests.map(r => r.rqid)).toEqual([21]);
    session.destroy();
  });

  it('applies lines that arrive after a pre-mount resync, once, in order', async () => {
    const spy = makeSpy();
    const session = new BattleSession('room-headless-tail', spy.callbacks);
    session.setAcceleration(8);
    session.resync(OPENING);
    session.addLine('|-damage|p2a: Rhydon|180/250');

    session.initScene(makeField(), 0);
    await waitFor(() => (session.battle.p2!.active[0] as any).hp === 180);
    expect(session.htmlLog.length).toBe(OPENING.length + 1);
    session.destroy();
  });
});

describe('BattleSession — ending and teardown', () => {
  it('announces |win| once even when it is delivered twice', async () => {
    const { session, spy } = makeSession();
    await feed(session, [...OPENING, '|win|Alice']);
    expect(spy.ends).toEqual(['Alice']);
    expect(session.battleComplete).toBe(true);

    session.resync([...OPENING, '|win|Alice'], { seq: 3 });
    await settle(5);
    expect(spy.ends).toEqual(['Alice']);
    session.destroy();
  });

  it('treats |tie| as an ending', async () => {
    const { session, spy } = makeSession();
    await feed(session, [...OPENING, '|tie|']);
    expect(spy.ends).toHaveLength(1);
    session.destroy();
  });

  it('stops notifying after destroy', async () => {
    const { session, spy } = makeSession();
    await feed(session, OPENING);
    session.destroy();
    const updates = spy.updates;
    session.addLine('|turn|2');
    session.handleRequest(request(1));
    await settle(10);
    expect(spy.updates).toBe(updates);
    expect(session.battle.turn).toBe(1);
  });

  it('resolves anything awaiting a commit when destroyed', async () => {
    const { session } = makeSession({ acceleration: 1 });
    const pending = session.awaitCommit();
    session.destroy();
    await expect(pending).resolves.toBeUndefined();
  });

  it('exposes the ledger through getState', async () => {
    const { session } = makeSession();
    await feed(session, [...OPENING, '|-damage|p2a: Rhydon|180/250']);
    const state = session.getState();
    expect(state.ledger).toBe(session.ledger);
    const entry = state.ledger.get(session.battle.p2!.active[0] as any)!;
    expect(state.ledger.lostThisTurn(entry)).toBe(70);
    session.destroy();
  });
});

describe('BattleSession — scene rebinding', () => {
  it('keeps the processor (and the names the formatter learned) across a remount', async () => {
    const { session } = makeSession();
    await feed(session, OPENING);
    const firstScene = session.scene!;
    const processor = (session as any).processor;

    session.initScene(makeField(), 0);
    expect((session as any).processor).toBe(processor);
    expect(session.scene).not.toBe(firstScene);
    expect(firstScene.destroyed).toBe(true);
    expect(session.scene!.battle).toBe(session.battle);

    const before = session.htmlLog.length;
    await feed(session, ['|switch|p2a: Snorlax|Snorlax, L50, M|300/300']);
    // "Bob" survives the remount; a rebuilt formatter would say "Player 2".
    expect(session.htmlLog.slice(before).join('')).toContain('Bob');
    session.destroy();
  });

  it('does not re-apply buffered lines when initScene runs twice on the same element', async () => {
    const { session, field } = makeSession();
    await feed(session, [...OPENING, '|-damage|p2a: Rhydon|180/250']);
    session.initScene(field, 0);
    session.initScene(field, 0);
    await settle(10);
    expect((session.battle.p2!.active[0] as any).hp).toBe(180);
    session.destroy();
  });
});

describe('BattleSession — field state', () => {
  it('reads back weather, terrain, rooms and hazards from the battle', async () => {
    const { session } = makeSession();
    await feed(session, [
      ...OPENING,
      '|-weather|RainDance',
      '|-fieldstart|move: Trick Room|[of] p1a: Pikachu',
      '|-sidestart|p1: Alice|move: Stealth Rock',
      '|-sidestart|p1: Alice|Spikes',
      '|-sidestart|p1: Alice|Spikes',
    ]);
    const battle: any = session.battle;
    expect(battle.field.weatherState.id).toBe('rain');
    expect(Object.keys(battle.field.pseudoWeather)).toContain('trickroom');
    expect(battle.p1.sideConditions.stealthrock.level).toBe(1);
    expect(battle.p1.sideConditions.spikes.level).toBe(2);

    await feed(session, [
      '|-fieldend|move: Trick Room',
      '|-sideend|p1: Alice|Spikes',
      '|-weather|none',
    ]);
    expect(Object.keys(battle.field.pseudoWeather)).not.toContain('trickroom');
    expect(battle.p1.sideConditions.spikes).toBeUndefined();
    expect(battle.field.weatherState.id).toBe('');
    session.destroy();
  });
});
