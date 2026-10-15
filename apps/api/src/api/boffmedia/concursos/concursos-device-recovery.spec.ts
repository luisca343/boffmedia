import { HttpException } from '@nestjs/common';
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
  profile: Partial<ConcursosRecoverySettingsDto> = {},
) {
  const rooms = new ConcursosRoomsService();
  const { code } = rooms.create(
    token(1),
    'qa',
    recoverySettings({ ...recoverySettings(), ...profile }),
  );
  rooms.configure(code, token(1), { mode, pacing: 'directed' });
  const sockets = new Map<number, symbol>();
  for (let n = 2; n <= (mode === 'teams' ? 5 : 3); n++) {
    rooms.join(code, token(n), `P${n}`);
    if (mode === 'teams')
      rooms.group(code, token(n), n < 4 ? 'team-1' : 'team-2');
    const socket = Symbol();
    sockets.set(n, socket);
    rooms.socketOpened(code, token(n), socket);
  }
  const state = () => rooms.read(code, token(1));
  const request = (n = 8, nickname = 'P2', source = 'qa') =>
    rooms.requestDeviceRecovery(code, token(n), nickname, source);
  const decide = (id: string, approve = true) =>
    rooms.decideDeviceRecovery(code, token(1), id, approve);
  const observe = (n = 8) => {
    const socket = Symbol();
    rooms.socketOpened(code, token(n), socket);
    return socket;
  };
  const disconnect = (n: number) =>
    rooms.socketClosed(code, token(n), sockets.get(n)!);
  const advance = (
    ms: number,
    online = mode === 'teams' ? [2, 3, 4, 5] : [2, 3],
  ) => {
    while (ms > 0) {
      const step = Math.min(ms, 500);
      jest.advanceTimersByTime(step);
      ms -= step;
      state();
      for (const n of online) rooms.read(code, token(n));
    }
  };
  const start = () =>
    rooms.startGame(code, token(1), {
      questions: [question, { ...question, id: 'q2' }],
    });
  return {
    rooms,
    code,
    state,
    request,
    decide,
    observe,
    disconnect,
    advance,
    start,
  };
}
function errorCode(run: () => unknown) {
  try {
    run();
    throw Error('expected failure');
  } catch (error) {
    return (error as HttpException).getResponse();
  }
}
describe('Host-approved device recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T10:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());
  it('keeps applicants private, capability-bound and outside game membership', () => {
    const s = setup();
    const before = s.state();
    const request = s.request();
    s.observe();
    expect(request).toMatchObject({
      nickname: 'P2',
      status: 'pending',
      expiresAt: Date.now() + 120000,
    });
    expect(request.verificationCode).toMatch(/^\d{6}$/);
    expect(s.rooms.watch(s.code, token(8))).toEqual({ recovery: request });
    expect(() => s.rooms.read(s.code, token(8))).toThrow();
    expect(() =>
      s.rooms.action(s.code, token(8), { action: 'choose', questionId: 'q' }),
    ).toThrow();
    expect(() => s.rooms.join(s.code, token(8), 'Other')).toThrow();
    expect(s.state().members).toEqual(before.members);
    expect(s.state().pendingRecoveries).toEqual([request]);
    expect(s.rooms.read(s.code, token(2)).pendingRecoveries).toBeUndefined();
    const serialized = JSON.stringify(s.state());
    expect(serialized).not.toContain(token(8));
    expect(serialized).not.toContain(token(2));
  });
  it.each(['individual', 'teams'] as const)(
    'transfers %s identity atomically during a question, keeping deadline, role, answer and score exactly once',
    (mode) => {
      const s = setup(mode);
      s.start();
      s.rooms.action(s.code, token(2), { action: 'choose', questionId: 'q' });
      s.rooms.action(s.code, token(2), {
        action: 'answer',
        roundId: 1,
        choice: 1,
      });
      const before = s.rooms.read(s.code, token(2));
      const request = s.request();
      const socket = s.observe();
      s.decide(request.id);
      const after = s.rooms.read(s.code, token(8));
      expect(after.memberId).toBe(before.memberId);
      expect(after.members.map((m) => m.id)).toEqual(
        before.members.map((m) => m.id),
      );
      expect(after.entities).toEqual(before.entities);
      expect(after.game).toMatchObject({
        roundId: 1,
        paused: false,
        deadlineAt: before.game!.deadlineAt,
        own: { answer: 1 },
      });
      expect(s.rooms.watch(s.code, token(8)).data?.memberId).toBe(
        before.memberId,
      );
      for (const action of [
        () => s.rooms.read(s.code, token(2)),
        () => s.rooms.join(s.code, token(2), 'Other'),
        () =>
          s.rooms.action(s.code, token(2), {
            action: 'answer',
            roundId: 1,
            choice: 1,
          }),
        () => s.request(2),
      ])
        expect(errorCode(action)).toMatchObject({ code: 'CONCURSOS_REVOKED' });
      expect(() =>
        s.rooms.action(s.code, token(8), {
          action: 'answer',
          roundId: 1,
          choice: 2,
        }),
      ).toThrow();
      s.rooms.action(s.code, token(mode === 'teams' ? 4 : 3), {
        action: 'answer',
        roundId: 1,
        choice: 0,
      });
      expect(s.state().entities[0].score).toBe(100);
      s.rooms.action(s.code, token(8), {
        action: 'answer',
        roundId: 1,
        choice: 1,
      });
      expect(s.state().entities[0].score).toBe(100);
      s.rooms.socketClosed(s.code, token(2), Symbol());
      expect(s.rooms.read(s.code, token(8), false).members[0].connected).toBe(
        true,
      );
      s.rooms.socketClosed(s.code, token(8), socket);
      expect(s.state().members[0].connected).toBe(false);
    },
  );
  it('keeps lobby order and transfers at full capacity without adding a member', () => {
    const s = setup('teams');
    const before = s.state();
    const request = s.request();
    s.observe();
    s.decide(request.id);
    const after = s.state();
    expect(after.members).toEqual(before.members);
    expect(after.entities).toEqual(before.entities);
    expect(after.members).toHaveLength(4);
    s.start();
    expect(s.rooms.read(s.code, token(8)).memberId).toBe(before.members[0].id);
  });
  it('does not give back a captain role that was already replaced', () => {
    const s = setup('teams');
    s.start();
    s.rooms.action(s.code, token(2), { action: 'choose', questionId: 'q' });
    s.disconnect(2);
    s.advance(5000, [3, 4, 5]);
    const before = s.state();
    expect(before.entities[0].captainId).toBe(before.members[1].id);
    const request = s.request();
    s.observe();
    s.decide(request.id);
    const after = s.rooms.read(s.code, token(8));
    expect(after.entities).toEqual(before.entities);
    expect(after.game!.deadlineAt).toBe(before.game!.deadlineAt);
    expect(() =>
      s.rooms.action(s.code, token(8), {
        action: 'answer',
        roundId: 1,
        choice: 1,
        captainRevision: before.entities[0].captainRevision,
      }),
    ).toThrow();
  });
  it('keeps all-player pause until host explicitly resumes after approval', () => {
    const s = setup();
    s.start();
    s.rooms.action(s.code, token(2), { action: 'choose', questionId: 'q' });
    s.disconnect(2);
    s.disconnect(3);
    s.advance(5000, []);
    const paused = s.state();
    expect(paused.game!.paused).toBe(true);
    const request = s.request();
    s.observe();
    expect(s.state().game!.paused).toBe(true);
    s.decide(request.id);
    expect(s.state().game).toMatchObject({
      paused: true,
      remainingMs: paused.game!.remainingMs,
    });
    const game = s.state().game!;
    s.rooms.action(s.code, token(1), {
      action: 'resume',
      roundId: game.roundId,
      controlRevision: game.controlRevision,
    });
    s.advance(3000, [8]);
    expect(s.state().game!.paused).toBe(false);
  });
  it('makes duplicate requests idempotent without extending expiry and lets owner cancel only their request', () => {
    const s = setup();
    const request = s.request();
    s.advance(1000);
    expect(s.request()).toEqual({ ...request, serverNow: Date.now() });
    const other = s.request(9);
    expect(other.verificationCode).not.toBe(request.verificationCode);
    expect(() =>
      s.rooms.cancelDeviceRecovery(s.code, token(9), request.id),
    ).toThrow();
    expect(
      s.rooms.cancelDeviceRecovery(s.code, token(8), request.id).status,
    ).toBe('cancelled');
    expect(
      s.rooms.cancelDeviceRecovery(s.code, token(8), request.id).status,
    ).toBe('cancelled');
    expect(() => s.decide(request.id)).toThrow();
    expect(s.rooms.read(s.code, token(2)).memberId).toBe(request.memberId);
  });
  it('denies without revoking the old phone and expires after configured duration', () => {
    const s = setup('individual', { deviceRecoveryMinutes: 1 });
    const request = s.request();
    s.decide(request.id, false);
    s.decide(request.id, false);
    expect(s.rooms.watch(s.code, token(8)).recovery?.status).toBe('denied');
    expect(s.rooms.read(s.code, token(2)).role).toBe('player');
    const second = s.request(9);
    s.advance(59999);
    expect(s.rooms.watch(s.code, token(9)).recovery?.status).toBe('pending');
    s.advance(1);
    expect(s.rooms.watch(s.code, token(9)).recovery?.status).toBe('expired');
    expect(() => s.decide(second.id)).toThrow();
    const renewed = s.request(10);
    expect(renewed.expiresAt).toBe(Date.now() + 60000);
  });
  it('permits only one winning approval and never restores an earlier approved access on retry', () => {
    const s = setup();
    const first = s.request();
    const rival = s.request(9);
    s.observe();
    s.decide(first.id);
    expect(s.rooms.watch(s.code, token(9)).recovery?.status).toBe('superseded');
    expect(() => s.decide(rival.id)).toThrow();
    const later = s.request(10);
    s.observe(10);
    s.decide(later.id);
    s.decide(first.id);
    expect(errorCode(() => s.rooms.read(s.code, token(8)))).toMatchObject({
      code: 'CONCURSOS_REVOKED',
    });
    expect(s.rooms.read(s.code, token(10)).memberId).toBe(first.memberId);
  });
  it('checks connected-device and question policies at both request and approval time', () => {
    const s = setup('individual', {
      allowConnectedDeviceRecovery: false,
      allowDeviceRecoveryDuringQuestion: false,
    });
    expect(() => s.request()).toThrow();
    s.disconnect(2);
    const request = s.request();
    s.observe();
    s.rooms.read(s.code, token(2));
    expect(() => s.decide(request.id)).toThrow();
    const reopened = Symbol();
    s.rooms.socketOpened(s.code, token(2), reopened);
    s.rooms.socketClosed(s.code, token(2), reopened);
    s.start();
    s.rooms.action(s.code, token(2), { action: 'choose', questionId: 'q' });
    const reopenedAgain = Symbol();
    s.rooms.socketOpened(s.code, token(2), reopenedAgain);
    s.rooms.socketClosed(s.code, token(2), reopenedAgain);
    expect(() => s.decide(request.id)).toThrow();
    const game = s.state().game!;
    s.rooms.action(s.code, token(1), {
      action: 'pause',
      roundId: 1,
      controlRevision: game.controlRevision,
    });
    expect(s.decide(request.id).pendingRecoveries).toHaveLength(0);
  });
  it('does not reset an ongoing absence when the approved applicant is offline', () => {
    const s = setup();
    s.start();
    s.disconnect(2);
    s.advance(10000, [3]);
    const before = s.state().game!.selectionSkipAt;
    const request = s.request();
    s.decide(request.id);
    expect(s.state().game!.selectionSkipAt).toBe(before);
    expect(s.state().members[0].connected).toBe(false);
  });
  it('enforces host authority, no applicant retargeting and bounded request creation', () => {
    const s = setup();
    const request = s.request();
    expect(() =>
      s.rooms.decideDeviceRecovery(s.code, token(3), request.id, true),
    ).toThrow();
    expect(() => s.request(8, 'P3')).toThrow();
    expect(() => s.request(1)).toThrow();
    expect(() => s.request(2)).toThrow();
    for (let n = 9; n <= 12; n++) s.request(n);
    expect(() => s.request(13)).toThrow();
    expect(s.state().pendingRecoveries).toHaveLength(5);
    s.rooms.close(s.code, token(1));
    expect(s.rooms.watch(s.code, token(8)).recovery?.status).toBe('closed');
    expect(() => s.request(14)).toThrow();
  });
  it('defaults old profiles safely and rejects invalid device options', () => {
    expect(recoverySettings()).toMatchObject({
      deviceRecoveryMinutes: 2,
      allowConnectedDeviceRecovery: true,
      allowDeviceRecoveryDuringQuestion: true,
    });
    for (const patch of [
      { deviceRecoveryMinutes: 0 },
      { deviceRecoveryMinutes: 11 },
      { deviceRecoveryMinutes: 1.5 },
      { allowConnectedDeviceRecovery: 1 },
      { allowDeviceRecoveryDuringQuestion: null },
    ])
      expect(() =>
        recoverySettings({ ...recoverySettings(), ...patch } as never),
      ).toThrow();
  });
});
