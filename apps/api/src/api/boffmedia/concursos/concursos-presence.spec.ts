import { ConcursosRoomsService } from './concursos-rooms.service';
import { recoverySettings } from './concursos-recovery-settings';
import type { ConcursosRecoverySettingsDto } from './concursos.dto';

const token = (n: number) => n.toString(16).padStart(48, '0');
const question = {
  id: 'q',
  category: 'QA',
  prompt: 'Which?',
  choices: ['A', 'B', 'C', 'D'],
  correctIndex: 1,
  seconds: 30,
  points: 100,
  phaseIndex: 0,
  phaseTitle: 'First',
};
function setup(
  mode: 'individual' | 'teams' = 'individual',
  patch: Partial<ConcursosRecoverySettingsDto> = {},
) {
  const rooms = new ConcursosRoomsService();
  const { code } = rooms.create(
    token(1),
    'qa',
    recoverySettings({ ...recoverySettings(), ...patch }),
  );
  rooms.configure(code, token(1), { mode, pacing: 'directed' });
  const sockets = new Map<number, symbol>();
  for (let n = 2; n <= 5; n++) {
    rooms.join(code, token(n), `P${n}`);
    if (mode === 'teams')
      rooms.group(code, token(n), n < 4 ? 'team-1' : 'team-2');
    const socket = Symbol();
    sockets.set(n, socket);
    rooms.socketOpened(code, token(n), socket);
  }
  rooms.startGame(code, token(1), {
    questions: [question, { ...question, id: 'q2' }],
  });
  const state = () => rooms.read(code, token(1));
  const disconnect = (n: number) =>
    rooms.socketClosed(code, token(n), sockets.get(n)!);
  const reconnect = (n: number) => {
    const restored = rooms.join(code, token(n), `P${n}`);
    const socket = Symbol();
    sockets.set(n, socket);
    rooms.socketOpened(code, token(n), socket);
    return restored;
  };
  const advance = (ms: number, online = [2, 3, 4, 5]) => {
    while (ms > 0) {
      const step = Math.min(ms, 500);
      jest.advanceTimersByTime(step);
      ms -= step;
      rooms.read(code, token(1));
      for (const n of online) rooms.read(code, token(n));
    }
  };
  const act = (
    n: number,
    body: Parameters<ConcursosRoomsService['action']>[2],
  ) => rooms.action(code, token(n), body);
  const control = (action: 'pause' | 'resume') => {
    const game = state().game!;
    return act(1, {
      action,
      roundId: game.roundId,
      controlRevision: game.controlRevision,
    });
  };
  return {
    rooms,
    code,
    state,
    disconnect,
    reconnect,
    advance,
    act,
    control,
    sockets,
  };
}

describe('Participant loss and same-browser recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T08:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());
  it.each(['individual', 'teams'] as const)(
    'keeps %s question deadline and scores unanswered absence as no answer',
    (mode) => {
      const s = setup(mode);
      const opened = s.act(2, { action: 'choose', questionId: 'q' });
      s.disconnect(2);
      if (mode === 'teams') s.disconnect(3);
      s.advance(29999, mode === 'teams' ? [4, 5] : [3, 4, 5]);
      expect(s.state().game).toMatchObject({
        stage: 'question',
        paused: false,
        deadlineAt: opened.game!.deadlineAt,
      });
      s.advance(1, mode === 'teams' ? [4, 5] : [3, 4, 5]);
      const result = s.state();
      expect(result.game!.stage).toBe('result');
      expect(result.game!.results![0]).toMatchObject({
        points: 0,
        correct: false,
      });
      expect(result.game!.results![0].answer).toBeUndefined();
    },
  );
  it.each(['individual', 'teams'] as const)(
    'passes an absent %s selector at twenty seconds without using a question or creating a debt',
    (mode) => {
      const s = setup(mode);
      const initial = s.state();
      s.disconnect(2);
      if (mode === 'teams') s.disconnect(3);
      const online = mode === 'teams' ? [4, 5] : [3, 4, 5];
      s.advance(19999, online);
      expect(s.state().game!.selectorId).toBe(initial.entities[0].id);
      expect(s.state().game!.selectionSkipAt).toBe(Date.now() + 1);
      s.advance(1, online);
      const next = s.state();
      expect(next.game).toMatchObject({
        selectorId: initial.entities[1].id,
        roundId: 0,
        selectionRevision: 1,
      });
      expect(next.game!.board).toHaveLength(2);
      s.reconnect(2);
      expect(() =>
        s.act(2, { action: 'choose', questionId: 'q', selectionRevision: 0 }),
      ).toThrow();
      const chooser = mode === 'teams' ? 4 : 3;
      expect(
        s.act(chooser, {
          action: 'choose',
          questionId: 'q',
          selectionRevision: 1,
        }).game!.roundId,
      ).toBe(1);
      expect(s.state().entities.every((e) => e.score === 0)).toBe(true);
    },
  );
  it.each(['individual', 'teams'] as const)(
    'counts an already absent %s chooser from loss, without granting another twenty seconds on the next board',
    (mode) => {
      const s = setup(mode);
      s.act(2, { action: 'choose', questionId: 'q' });
      const absent = mode === 'teams' ? [4, 5] : [3];
      for (const n of absent) s.disconnect(n);
      s.advance(
        30000,
        [2, 3, 4, 5].filter((n) => !absent.includes(n)),
      );
      expect(s.state().game!.stage).toBe('result');
      s.act(1, { action: 'next', roundId: 1 });
      const board = s.state();
      expect(board.game!.stage).toBe('board');
      expect(board.game!.roundId).toBe(1);
      expect(board.game!.selectorId).toBe(
        board.entities[mode === 'teams' ? 0 : 2].id,
      );
      expect(board.game!.selectionRevision).toBe(2);
      expect(board.game!.board).toHaveLength(1);
    },
  );
  it('cancels a pending selection skip after a short reconnect and preserves the same identity', () => {
    const s = setup();
    const before = s.state();
    s.disconnect(2);
    s.advance(10000, [3, 4, 5]);
    const restored = s.reconnect(2);
    expect(restored.memberId).toBe(before.entities[0].id);
    expect(s.state().game!.selectionSkipAt).toBeUndefined();
    s.advance(11000);
    expect(s.state().game!.selectorId).toBe(before.entities[0].id);
  });
  it('replaces a captain after five seconds without time extension, handback or an extra normal rotation', () => {
    const s = setup('teams');
    const before = s.state();
    const opened = s.act(2, { action: 'choose', questionId: 'q' });
    s.disconnect(2);
    s.advance(4999, [3, 4, 5]);
    expect(s.state().entities[0].captainId).toBe(before.members[0].id);
    s.advance(1, [3, 4, 5]);
    const changed = s.state();
    expect(changed.entities[0]).toMatchObject({
      captainId: before.members[1].id,
      captainRevision: 1,
      temporaryCaptain: true,
    });
    expect(changed.game!.deadlineAt).toBe(opened.game!.deadlineAt);
    s.reconnect(2);
    expect(s.state().entities[0].captainId).toBe(before.members[1].id);
    expect(() =>
      s.act(2, { action: 'answer', roundId: 1, choice: 1, captainRevision: 0 }),
    ).toThrow();
    s.act(3, { action: 'answer', roundId: 1, choice: 1, captainRevision: 1 });
    s.act(4, { action: 'answer', roundId: 1, choice: 0 });
    expect(s.state().entities[0].score).toBe(100);
    expect(() =>
      s.act(3, { action: 'answer', roundId: 1, choice: 2, captainRevision: 1 }),
    ).toThrow();
    s.act(1, { action: 'next', roundId: 1 });
    expect(s.state().entities[0]).toMatchObject({
      captainId: before.members[1].id,
      temporaryCaptain: false,
      captainRevision: 2,
    });
  });
  it('rejects an old command even if its former captain regains authority in the same round', () => {
    const s = setup('teams');
    s.act(2, { action: 'choose', questionId: 'q' });
    s.disconnect(2);
    s.advance(5000, [3, 4, 5]);
    s.reconnect(2);
    s.disconnect(3);
    s.advance(5000, [2, 4, 5]);
    expect(s.state().entities[0].captainRevision).toBe(2);
    expect(() =>
      s.act(2, { action: 'answer', roundId: 1, choice: 1, captainRevision: 0 }),
    ).toThrow();
    expect(
      s.act(2, { action: 'answer', roundId: 1, choice: 1, captainRevision: 2 })
        .game!.own!.answer,
    ).toBe(1);
  });
  it('does not replace for a short loss and counts actual overlapping connections', () => {
    const s = setup('teams');
    const first = s.state().entities[0].captainId;
    const extra = Symbol();
    s.rooms.socketOpened(s.code, token(2), extra);
    s.disconnect(2);
    s.advance(6000);
    expect(s.state().members[0].connected).toBe(true);
    expect(s.state().entities[0].captainId).toBe(first);
    s.rooms.socketClosed(s.code, token(2), extra);
    s.advance(4000, [3, 4, 5]);
    s.reconnect(2);
    s.advance(2000);
    expect(s.state().entities[0].captainId).toBe(first);
    // Closing a stale connection again cannot drop the replacement connection.
    s.rooms.socketClosed(s.code, token(2), extra);
    expect(s.state().members[0].connected).toBe(true);
  });
  it('detects a silent participant from the last confirmed heartbeat', () => {
    const s = setup('teams');
    s.advance(4999, [3, 4, 5]);
    expect(s.state().entities[0].captainRevision).toBe(0);
    s.advance(1, [3, 4, 5]);
    expect(s.state().entities[0].captainRevision).toBe(1);
    expect(s.state().members[0].connected).toBe(false);
  });
  it.each(['individual', 'teams'] as const)(
    'pauses after five seconds with all %s contestants gone, before skipping selection',
    (mode) => {
      const s = setup(mode);
      const initial = s.state();
      for (let n = 2; n <= 5; n++) s.disconnect(n);
      s.advance(4999, []);
      expect(s.state().game!.paused).toBe(false);
      s.advance(1, []);
      expect(s.state().game).toMatchObject({
        paused: true,
        pauseReason: 'players_disconnected',
        selectorId: initial.game!.selectorId,
        roundId: 0,
      });
      expect(() => s.control('resume')).toThrow();
      s.advance(60000, []);
      const restored = s.reconnect(3);
      expect(restored.game!.paused).toBe(true);
      s.control('resume');
      s.advance(3000, [3]);
      expect(s.state().game!.paused).toBe(false);
      expect(s.state().game!.selectorId).toBe(initial.game!.selectorId);
      s.advance(14999, [3]);
      expect(s.state().game!.selectorId).toBe(initial.game!.selectorId);
      s.advance(1, [3]);
      if (mode === 'individual')
        expect(s.state().game!.selectorId).not.toBe(initial.game!.selectorId);
      else expect(s.state().game!.selectorId).toBe(initial.game!.selectorId);
    },
  );
  it('applies an overdue all-player pause before question expiry on a delayed sweep', () => {
    const s = setup();
    s.act(2, { action: 'choose', questionId: 'q' });
    for (let n = 2; n <= 5; n++) s.disconnect(n);
    jest.advanceTimersByTime(60000);
    expect(s.state().game).toMatchObject({
      paused: true,
      stage: 'question',
      remainingMs: 25000,
      pauseReason: 'players_disconnected',
    });
    expect(s.state().game!.question).toBeUndefined();
    expect(s.state().entities.every((e) => e.score === 0)).toBe(true);
  });
  it('freezes the absent-selection wait during manual pause and countdown', () => {
    const s = setup();
    s.disconnect(2);
    s.advance(8000, [3, 4, 5]);
    s.control('pause');
    s.advance(60000, [3, 4, 5]);
    expect(s.state().game!.selectionRemainingMs).toBe(12000);
    s.control('resume');
    s.advance(3000, [3, 4, 5]);
    expect(s.state().game!.selectionSkipAt).toBe(Date.now() + 12000);
    s.advance(11999, [3, 4, 5]);
    expect(s.state().game!.selectionRevision).toBe(0);
    s.advance(1, [3, 4, 5]);
    expect(s.state().game!.selectionRevision).toBe(1);
  });
  it('keeps manual pause on reconnect and cancels countdown on a fresh all-player loss', () => {
    const s = setup('individual', { allDisconnectedGraceSeconds: 1 });
    s.control('pause');
    for (let n = 2; n <= 5; n++) s.disconnect(n);
    s.advance(2000, []);
    expect(s.state().game!.pauseReason).toBe('manual');
    s.reconnect(2);
    expect(s.state().game!.paused).toBe(true);
    s.control('resume');
    s.disconnect(2);
    s.advance(1000, []);
    expect(s.state().game!.paused).toBe(true);
    expect(s.state().game!.resumeAt).toBeUndefined();
  });
  it.each(['individual', 'teams'] as const)(
    'retains %s membership, points and accepted commitments after a long absence',
    (mode) => {
      const s = setup(mode);
      s.act(2, { action: 'choose', questionId: 'q' });
      s.act(2, { action: 'answer', roundId: 1, choice: 1 });
      const before = s.rooms.read(s.code, token(2));
      s.disconnect(2);
      s.advance(120000, [3, 4, 5]);
      const restored = s.reconnect(2);
      expect(restored.memberId).toBe(before.memberId);
      expect(restored.members).toHaveLength(4);
      expect(restored.entities[0].score).toBe(100);
      expect(restored.game!.own!.answer).toBe(1);
      expect(() => s.rooms.join(s.code, token(8), 'P2')).toThrow();
      expect(() =>
        s.act(2, {
          action: 'answer',
          roundId: 1,
          choice: 2,
          captainRevision: restored.entities[0].captainRevision,
        }),
      ).toThrow();
    },
  );
  it('supports custom zero-second rules, disabled automatic policies and immutable settings', () => {
    const s = setup('teams', {
      captainGraceSeconds: 0,
      absentSelectorSeconds: 0,
      allDisconnectedGraceSeconds: 0,
    });
    s.disconnect(2);
    expect(s.state().entities[0].captainRevision).toBe(1);
    s.disconnect(3);
    expect(s.state().game!.selectionRevision).toBe(1);
    s.disconnect(4);
    s.disconnect(5);
    expect(s.state().game!.paused).toBe(true);
    const disabled = setup('teams', {
      skipAbsentSelector: false,
      autoReplaceCaptain: false,
      pauseWhenAllDisconnected: false,
    });
    const first = disabled.state().game!.selectorId;
    for (let n = 2; n <= 5; n++) disabled.disconnect(n);
    disabled.advance(60000, []);
    expect(disabled.state().game).toMatchObject({
      paused: false,
      selectorId: first,
      selectionRevision: 0,
    });
    expect(disabled.state().entities[0].captainRevision).toBe(0);
    expect(() =>
      disabled.rooms.configure(disabled.code, token(1), {
        recoverySettings: recoverySettings(),
      }),
    ).toThrow();
  });
  it('resets selection waiting after reconnecting and disconnecting again during a pause', () => {
    const s = setup();
    s.disconnect(2);
    s.advance(8000, [3, 4, 5]);
    s.control('pause');
    s.advance(1000, [3, 4, 5]);
    s.reconnect(2);
    expect(s.state().game!.selectionRemainingMs).toBeUndefined();
    s.disconnect(2);
    s.advance(30000, [3, 4, 5]);
    s.control('resume');
    s.advance(3000, [3, 4, 5]);
    expect(s.state().game!.selectionSkipAt).toBe(Date.now() + 20000);
    s.advance(19999, [3, 4, 5]);
    expect(s.state().game!.selectionRevision).toBe(0);
    s.advance(1, [3, 4, 5]);
    expect(s.state().game!.selectionRevision).toBe(1);
  });
  it.each([
    [2, 5, 'host_disconnected', 28000],
    [5, 1, 'players_disconnected', 29000],
  ] as const)(
    'applies the earliest pause for host grace %s and contestant grace %s',
    (hostGraceSeconds, allDisconnectedGraceSeconds, reason, remaining) => {
      const s = setup('individual', {
        hostGraceSeconds,
        allDisconnectedGraceSeconds,
      });
      s.act(2, { action: 'choose', questionId: 'q' });
      const hostSocket = Symbol();
      s.rooms.socketOpened(s.code, token(1), hostSocket);
      s.rooms.socketClosed(s.code, token(1), hostSocket);
      for (let n = 2; n <= 5; n++) s.disconnect(n);
      jest.advanceTimersByTime(10000);
      expect(s.state().game).toMatchObject({
        paused: true,
        stage: 'question',
        pauseReason: reason,
        remainingMs: remaining,
      });
    },
  );
  it('validates new profile defaults, ranges, types and safe defaulting for older version-one payloads', () => {
    expect(recoverySettings()).toMatchObject({
      skipAbsentSelector: true,
      absentSelectorSeconds: 20,
      autoReplaceCaptain: true,
      captainGraceSeconds: 5,
      pauseWhenAllDisconnected: true,
      allDisconnectedGraceSeconds: 5,
    });
    for (const patch of [
      { absentSelectorSeconds: -1 },
      { absentSelectorSeconds: 121 },
      { captainGraceSeconds: 61 },
      { allDisconnectedGraceSeconds: -1 },
      { captainGraceSeconds: 0.5 },
      { skipAbsentSelector: 'yes' },
      { autoReplaceCaptain: 1 },
      { pauseWhenAllDisconnected: null },
    ])
      expect(() =>
        recoverySettings({ ...recoverySettings(), ...patch } as never),
      ).toThrow();
    expect(
      recoverySettings({ version: 1, hostGraceSeconds: 2 } as never),
    ).toMatchObject({
      hostGraceSeconds: 2,
      absentSelectorSeconds: 20,
      captainGraceSeconds: 5,
    });
  });
});
