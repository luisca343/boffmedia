/**
 * The PvP netcode, driven by a fake socket.
 *
 * Real `BattleSession`s throughout (accelerated to 8, so animations resolve
 * immediately and the assertions measure state rather than duration): a mock
 * session would only prove that the inbox calls the methods this file already
 * says it calls. What is worth proving is the OUTCOME — the opening request
 * survives a late-mounting screen, a duplicate frame does nothing, a hole in
 * the sequence is repaired exactly once, and a reconnect re-enters every room.
 */

import { describe, expect, it, vi } from 'vitest';

import { PvpInbox, parseRequestLine } from '../../pvp/pvpInbox';
import { BattleSession } from '../../engine/BattleSession';
import { OPENING, makeField, makeSpy, settle, waitFor, type Spy } from '../../engine/__tests__/helpers';

/** socket.io's surface, as much of it as the provider uses. */
function fakeSocket() {
  const handlers = new Map<string, Array<(...args: any[]) => void>>();
  const sent: Array<{ event: string; payload: any }> = [];
  return {
    connected: true,
    sent,
    on(event: string, handler: (...args: any[]) => void) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return this;
    },
    off(event: string, handler: (...args: any[]) => void) {
      const list = handlers.get(event) ?? [];
      handlers.set(event, list.filter((h) => h !== handler));
      return this;
    },
    emit(event: string, payload?: any) {
      sent.push({ event, payload });
      return this;
    },
    /** Deliver a server frame. */
    fire(event: string, payload?: any) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler(payload);
    },
    listenerCount(event: string) {
      return (handlers.get(event) ?? []).length;
    },
  };
}

type FakeSocket = ReturnType<typeof fakeSocket>;

/**
 * The provider's subscription, without React.
 *
 * Kept in step with `PvpSocketProvider.subscribe` by hand and deliberately: the
 * provider's own body is three lines of `next.on(...)` around this exact
 * routing, and pulling React in to reach them would test the renderer instead
 * of the netcode.
 */
function wire(socket: FakeSocket) {
  const inbox = new PvpInbox(socket);
  let hasConnected = socket.connected;
  socket.on('protocol', (d: any) => inbox.handleProtocol(d));
  socket.on('battleEnd', (d: any) => inbox.handleBattleEnd(d));
  socket.on('resumed', (d: any) => inbox.handleResumed(d, 'resumed'));
  socket.on('spectateJoined', (d: any) => inbox.handleResumed(d, 'spectateJoined'));
  socket.on('chatMessage', (d: any) => inbox.handleChat(d));
  socket.on('timerUpdate', (d: any) => inbox.handleTimer(d));
  socket.on('error', (d: any) => inbox.handleError(d ?? {}));
  socket.on('battleCreated', (d: any) => {
    if (!d?.roomId) return;
    const room = inbox.room(d.roomId);
    if (d.side === 'p1' || d.side === 'p2') room.side = d.side;
  });
  socket.on('connect', () => {
    if (hasConnected) inbox.resumeAll();
    hasConnected = true;
  });
  return inbox;
}

function makeSession(roomId = 'room-1', spy: Spy = makeSpy()) {
  const session = new BattleSession(roomId, spy.callbacks);
  session.livePaced = true;
  session.status = 'active';
  session.setAcceleration(8);
  session.initScene(makeField(), 0);
  return { session, spy };
}

const REQUEST = (rqid: number) =>
  `|request|${JSON.stringify({ rqid, active: [{ moves: [{ move: 'Thunderbolt', id: 'thunderbolt' }] }], side: { id: 'p1', name: 'Alice', pokemon: [] } })}`;

/** Wait until the session's queue is empty. */
async function drain(session: BattleSession) {
  await waitFor(() => !(session as any).processing && (session as any).lineBuffer.length === 0);
  await settle(5);
}

describe('PvpInbox — the opening request', () => {
  it('buffers everything that arrives before a screen exists, then delivers it in order', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);

    // The whole opening, INCLUDING the first request, arrives while the player
    // is still on the lobby screen. This is C3: the gateway starts the battle
    // the moment it answers `battleCreated`.
    socket.fire('battleCreated', { roomId: 'room-1', format: 'gen9ou', side: 'p1' });
    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    socket.fire('protocol', { roomId: 'room-1', seq: OPENING.length, line: REQUEST(1) });

    const room = inbox.peek('room-1')!;
    expect(room.buffered).toHaveLength(OPENING.length + 1);
    expect(room.side).toBe('p1');

    const { session, spy } = makeSession();
    inbox.attachSession('room-1', session);
    await drain(session);

    // Delivered, once, in order — and the move list is on screen.
    expect(spy.requests).toHaveLength(1);
    expect((spy.requests[0] as any).rqid).toBe(1);
    expect(session.battle.turn).toBe(1);
    expect(session.battle.p1.active[0]?.speciesForme).toBe('Pikachu');
    expect(room.buffered).toHaveLength(0);
  });

  it('takes the side from the server, not from the screen', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session } = makeSession();

    inbox.room('room-1').side = 'p2';
    inbox.attachSession('room-1', session);
    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    await drain(session);

    // pov 1 = the p2 half of the field is the near one.
    expect((session as any).pov).toBe(1);
  });
});

describe('PvpInbox — duplicates and gaps', () => {
  it('ignores a frame it has already applied', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session } = makeSession();
    inbox.attachSession('room-1', session);

    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    await drain(session);
    const hp = session.battle.p2.active[0]!.hp;

    socket.fire('protocol', { roomId: 'room-1', seq: OPENING.length, line: '|-damage|p2a: Rhydon|200/250' });
    await drain(session);
    expect(session.battle.p2.active[0]!.hp).toBe(200);

    // The SAME frame again: a resend, or a second subscription that has since
    // been removed. Applying it twice would read as a second hit.
    socket.fire('protocol', { roomId: 'room-1', seq: OPENING.length, line: '|-damage|p2a: Rhydon|200/250' });
    await drain(session);
    expect(session.battle.p2.active[0]!.hp).toBe(200);
    expect(hp).toBe(250);
  });

  it('asks for a resync ONCE on a hole, and applies the answer exactly once', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session } = makeSession();
    inbox.room('room-1').side = 'p1';
    inbox.attachSession('room-1', session);

    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    await drain(session);

    // Frames 11 and 12 never arrived: the move and the damage of turn 1.
    socket.fire('protocol', { roomId: 'room-1', seq: 13, line: '|turn|2' });
    const resumes = socket.sent.filter((m) => m.event === 'resume');
    expect(resumes).toHaveLength(1);
    expect(resumes[0].payload).toEqual({ roomId: 'room-1' });
    expect(inbox.peek('room-1')!.resyncing).toBe(true);
    await drain(session);

    // Everything that arrives while the ask is in flight is HELD, not applied:
    // it would land on a battle that is about to be thrown away. Nothing
    // reaches `acceptFrame`, so nothing can raise a second gap either.
    socket.fire('protocol', { roomId: 'room-1', seq: 14, line: '|-damage|p2a: Rhydon|100/250' });
    expect(socket.sent.filter((m) => m.event === 'resume')).toHaveLength(1);

    const log = [
      ...OPENING,
      '|move|p1a: Pikachu|Thunderbolt|p2a: Rhydon',
      '|-damage|p2a: Rhydon|180/250',
      '|turn|2',
    ];
    socket.fire('resumed', {
      roomId: 'room-1',
      side: 'p1',
      status: 'active',
      replay: log,
      seq: log.length - 1,
      format: 'gen9ou',
    });
    await drain(session);

    expect(inbox.peek('room-1')!.resyncing).toBe(false);
    expect(session.battle.turn).toBe(2);
    // The held frame is replayed after the rebuild, and the one the log already
    // covered (seq 13) is dropped as the duplicate it is.
    expect(session.battle.p2.active[0]!.hp).toBe(100);
    // ONE copy of the log plus the one held frame — this is C1. `addLine` in a
    // loop would have appended a second pass onto a populated battle.
    expect(session.htmlLog.length).toBe(log.length + 1);
  });

  it('is idempotent: the same resumed frame twice lands on the same state', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session } = makeSession();
    inbox.attachSession('room-1', session);

    const log = [...OPENING, '|-damage|p2a: Rhydon|100/250', '|turn|2'];
    const frame = { roomId: 'room-1', side: 'p1' as const, status: 'active', replay: log, seq: log.length - 1 };

    socket.fire('resumed', frame);
    await drain(session);
    const first = { turn: session.battle.turn, hp: session.battle.p2.active[0]!.hp, log: session.htmlLog.length };

    socket.fire('resumed', frame);
    await drain(session);

    expect(session.battle.turn).toBe(first.turn);
    expect(session.battle.p2.active[0]!.hp).toBe(first.hp);
    expect(session.htmlLog.length).toBe(first.log);
  });

  it('holds a log that arrives before the screen, and applies it on adopt', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);

    const log = [...OPENING, '|-damage|p2a: Rhydon|100/250'];
    socket.fire('spectateJoined', { roomId: 'room-9', side: null, status: 'active', replay: log, seq: log.length - 1 });
    expect(inbox.peek('room-9')!.pendingResync).not.toBeNull();

    const { session } = makeSession('room-9');
    inbox.attachSession('room-9', session);
    await drain(session);

    expect(session.battle.p2.active[0]!.hp).toBe(100);
    expect(inbox.peek('room-9')!.pendingResync).toBeNull();
  });
});

describe('PvpInbox — reconnect', () => {
  it('resumes rooms it plays and spectates the rest', () => {
    const socket = fakeSocket();
    const inbox = wire(socket);

    inbox.room('mine').side = 'p2';
    inbox.room('watching');
    inbox.room('over').status = 'finished';

    socket.sent.length = 0;
    socket.fire('connect');

    const byRoom = new Map(socket.sent.map((m) => [m.payload.roomId, m.event]));
    expect(byRoom.get('mine')).toBe('resume');
    expect(byRoom.get('watching')).toBe('spectate');
    // A battle that has already ended is not worth a grace timer.
    expect(byRoom.has('over')).toBe(false);
  });

  it('does not resume on the FIRST connect', () => {
    const socket = fakeSocket();
    socket.connected = false;
    const inbox = wire(socket);
    inbox.room('mine').side = 'p1';

    socket.fire('connect');
    expect(socket.sent.filter((m) => m.event === 'resume')).toHaveLength(0);

    socket.fire('connect');
    expect(socket.sent.filter((m) => m.event === 'resume')).toHaveLength(1);
  });
});

describe('PvpInbox — battleEnd', () => {
  it('sets winner and replayId and NOTHING else', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session, spy } = makeSession();
    inbox.attachSession('room-1', session);

    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    await drain(session);

    socket.fire('battleEnd', { roomId: 'room-1', seq: 99, winner: 'Alice', replayId: 42 });

    expect(session.winner).toBe('Alice');
    expect(session.replayId).toBe(42);
    // M3: `battleComplete` is the session's, reached when `|win|` has been
    // through the queue. Setting it here raced the flush and put the end screen
    // over a half-played last turn.
    expect(session.battleComplete).toBe(false);
    expect(spy.ends).toHaveLength(0);

    socket.fire('protocol', { roomId: 'room-1', seq: OPENING.length, line: '|win|Alice' });
    await drain(session);
    expect(session.battleComplete).toBe(true);
    expect(spy.ends).toEqual(['Alice']);
  });

  it('carries a result recorded before the screen mounted onto the session', () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    socket.fire('battleEnd', { roomId: 'room-1', winner: 'Bob', replayId: 7 });

    const { session } = makeSession();
    inbox.attachSession('room-1', session);
    expect(session.winner).toBe('Bob');
    expect(session.replayId).toBe(7);
  });
});

describe('PvpInbox — a rejected choice', () => {
  it('clears the waiting state and re-prompts on stale_choice, once', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const { session, spy } = makeSession();
    inbox.attachSession('room-1', session);

    OPENING.forEach((line, i) => socket.fire('protocol', { roomId: 'room-1', seq: i, line }));
    socket.fire('protocol', { roomId: 'room-1', seq: OPENING.length, line: REQUEST(5) });
    await drain(session);
    expect(spy.requests).toHaveLength(1);

    session.makeChoice('move 1', socket as any);
    expect(socket.sent.at(-1)).toEqual({
      event: 'makeChoice',
      payload: { roomId: 'room-1', choice: 'move 1', rqid: 5 },
    });
    expect(session.isWaitingForChoice).toBe(false);

    socket.fire('error', { roomId: 'room-1', code: 'stale_choice' });
    await drain(session);

    // The prompt is back, carrying the SAME rqid — the choice the server is
    // still waiting for. Restored directly, because the session's rqid dedupe
    // makes `handleRequest` a deliberate no-op for a request it has seen.
    expect(spy.requests).toHaveLength(2);
    expect((spy.requests[1] as any).rqid).toBe(5);

    // A second rejection re-states the same prompt rather than stacking a
    // second one: the dock reads `currentRequest`, and it is the same request.
    socket.fire('error', { roomId: 'room-1', code: 'stale_choice' });
    await drain(session);
    expect((session.currentRequest as any).rqid).toBe(5);
    expect(session.isWaitingForChoice).toBe(true);
    expect(session.pendingRequests).toHaveLength(0);
  });

  it('leaves a room-scoped error that is not about a choice alone', async () => {
    const socket = fakeSocket();
    const inbox = wire(socket);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { session, spy } = makeSession();
    inbox.attachSession('room-1', session);

    socket.fire('error', { roomId: 'room-1', code: 'rate_limited' });
    expect(spy.requests).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('parseRequestLine', () => {
  it('parses a request line and refuses anything else', () => {
    expect(parseRequestLine(REQUEST(3))?.rqid).toBe(3);
    expect(parseRequestLine('|turn|1')).toBeNull();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseRequestLine('|request|{not json')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
