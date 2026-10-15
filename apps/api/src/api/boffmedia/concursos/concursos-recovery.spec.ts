import { ConcursosRoomsService } from './concursos-rooms.service';
import { ConcursosActionDto } from './concursos.dto';
import { recoverySettings } from './concursos-recovery-settings';
const token = (n: number) => n.toString(16).padStart(48, '0');
const question = {
  id: 'q',
  category: 'Ciencia',
  prompt: '¿Cuál?',
  choices: ['A', 'B', 'C', 'D'],
  correctIndex: 1,
  seconds: 30,
  points: 100,
  phaseIndex: 0,
  phaseTitle: 'Primera',
};
function setup(
  mode: 'individual' | 'teams' = 'individual',
  pacing: 'automatic' | 'directed' = 'automatic',
  profile = recoverySettings(),
) {
  const rooms = new ConcursosRoomsService();
  const { code } = rooms.create(token(1), 'qa', profile);
  for (let n = 2; n <= 5; n++) rooms.join(code, token(n), `P${n}`);
  rooms.configure(code, token(1), { mode, pacing });
  if (mode === 'teams')
    for (let n = 2; n <= 5; n++)
      rooms.group(code, token(n), n < 4 ? 'team-1' : 'team-2');
  rooms.startGame(code, token(1), {
    questions: [question, { ...question, id: 'q2' }],
  });
  // Keep contestants present while this suite independently exercises host loss/pause.
  setInterval(() => {
    for (let n = 2; n <= 5; n++) rooms.read(code, token(n));
  }, 1000);
  return { rooms, code };
}
function control(
  rooms: ConcursosRoomsService,
  code: string,
  action: 'pause' | 'resume',
) {
  const game = rooms.read(code, token(1)).game!;
  return rooms.action(code, token(1), {
    action,
    roundId: game.roundId,
    controlRevision: game.controlRevision,
  });
}
describe('Configurable authoritative pause and host recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T19:00:00Z'));
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it('uses the chosen defaults and validates complete versioned profiles without accepting extra fields', () => {
    expect(recoverySettings()).toEqual({
      version: 1,
      hostGraceSeconds: 5,
      hostRetentionMinutes: 10,
      hideQuestionWhilePaused: true,
      allowLocalSelectionWhilePaused: false,
      resumeCountdownSeconds: 3,
      skipAbsentSelector: true,
      absentSelectorSeconds: 20,
      autoReplaceCaptain: true,
      captainGraceSeconds: 5,
      pauseWhenAllDisconnected: true,
      allDisconnectedGraceSeconds: 5,
    });
    for (const patch of [
      { version: 2 },
      { hostGraceSeconds: -1 },
      { hostGraceSeconds: 61 },
      { hostRetentionMinutes: 0 },
      { hostRetentionMinutes: 241 },
      { resumeCountdownSeconds: 11 },
      { resumeCountdownSeconds: 2.5 },
      { hideQuestionWhilePaused: 'yes' },
      { allowLocalSelectionWhilePaused: 1 },
      { extra: true },
    ])
      expect(() =>
        recoverySettings({ ...recoverySettings(), ...patch } as never),
      ).toThrow();
    const profile = recoverySettings({
      ...recoverySettings(),
      hostGraceSeconds: 0,
      hostRetentionMinutes: 240,
      resumeCountdownSeconds: 0,
    });
    expect(profile.hostGraceSeconds).toBe(0);
  });
  it.each(['individual', 'teams'] as const)(
    'freezes %s question time, hides question, preserves accepted answers/proposals and rejects all submissions',
    (mode) => {
      const { rooms, code } = setup(mode);
      rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
      if (mode === 'teams')
        rooms.action(code, token(3), {
          action: 'propose',
          roundId: 1,
          choice: 2,
        });
      rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 });
      jest.advanceTimersByTime(2000);
      const pause = control(rooms, code, 'pause');
      expect(pause.game).toMatchObject({
        paused: true,
        pauseReason: 'manual',
        remainingMs: 28000,
      });
      expect(pause.game!.question).toBeUndefined();
      const payload: ConcursosActionDto = {
        action: 'pause',
        roundId: 1,
        controlRevision: pause.game!.controlRevision - 1,
      };
      jest.advanceTimersByTime(60000);
      rooms.action(code, token(1), payload); // exact retry must not change frozen time
      expect(rooms.read(code, token(2)).game!.own!.answer).toBe(1);
      if (mode === 'teams')
        expect(rooms.read(code, token(3)).game!.own!.proposals).toHaveLength(1);
      for (const action of ['answer', 'propose'] as const)
        expect(() =>
          rooms.action(code, token(4), { action, roundId: 1, choice: 1 }),
        ).toThrow();
      expect(() =>
        rooms.action(code, token(4), {
          action: 'resume',
          roundId: 1,
          controlRevision: pause.game!.controlRevision,
        }),
      ).toThrow();
      const resumed = control(rooms, code, 'resume');
      const resumeAt = resumed.game!.resumeAt;
      const retry = {
        action: 'resume' as const,
        roundId: 1,
        controlRevision: resumed.game!.controlRevision - 1,
      };
      jest.advanceTimersByTime(2999);
      rooms.action(code, token(1), retry);
      expect(rooms.read(code, token(4)).game!.resumeAt).toBe(resumeAt);
      expect(rooms.read(code, token(4)).game!.paused).toBe(true);
      jest.advanceTimersByTime(1);
      const active = rooms.read(code, token(4));
      expect(active.game!.paused).toBe(false);
      expect(active.game!.deadlineAt! - active.game!.serverNow).toBe(28000);
      expect(active.game!.question!.correctIndex).toBeUndefined();
      expect(() => rooms.action(code, token(1), payload)).toThrow(); // old pause must not re-pause
      expect(active.entities[0].score).toBe(0);
    },
  );
  it.each(['automatic', 'directed'] as const)(
    'freezes %s results and retains scores through resume',
    (pacing) => {
      const { rooms, code } = setup('teams', pacing);
      rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
      rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 });
      rooms.action(code, token(4), { action: 'answer', roundId: 1, choice: 0 });
      jest.advanceTimersByTime(2000);
      const pause = control(rooms, code, 'pause');
      if (pacing === 'automatic') expect(pause.game!.remainingMs).toBe(6000);
      expect(pause.game!.question!.correctIndex).toBe(1);
      jest.advanceTimersByTime(20000);
      expect(rooms.read(code, token(2)).game!.stage).toBe('result');
      expect(() =>
        rooms.action(code, token(1), { action: 'next', roundId: 1 }),
      ).toThrow();
      control(rooms, code, 'resume');
      jest.advanceTimersByTime(3000);
      expect(rooms.read(code, token(1)).entities[0].score).toBe(100);
      if (pacing === 'automatic') {
        jest.advanceTimersByTime(5999);
        expect(rooms.read(code, token(2)).game!.stage).toBe('result');
        jest.advanceTimersByTime(1);
        expect(rooms.read(code, token(2)).game!.stage).toBe('board');
      } else {
        jest.advanceTimersByTime(20000);
        expect(rooms.read(code, token(2)).game!.stage).toBe('result');
        rooms.action(code, token(1), { action: 'next', roundId: 1 });
      }
      expect(rooms.read(code, token(2)).entities[0].score).toBe(100);
    },
  );
  it('supports immediate resume, visible paused questions and cancels a pending resume without changing frozen time', () => {
    const { rooms, code } = setup(
      'individual',
      'automatic',
      recoverySettings({
        ...recoverySettings(),
        hideQuestionWhilePaused: false,
        allowLocalSelectionWhilePaused: true,
        resumeCountdownSeconds: 0,
      }),
    );
    rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
    const paused = control(rooms, code, 'pause');
    expect(paused.game!.question!.choices).toHaveLength(4);
    expect(() =>
      rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 }),
    ).toThrow();
    expect(control(rooms, code, 'resume').game!.paused).toBe(false);
    const other = setup();
    other.rooms.action(other.code, token(2), {
      action: 'choose',
      questionId: 'q',
    });
    const first = control(other.rooms, other.code, 'pause');
    control(other.rooms, other.code, 'resume');
    jest.advanceTimersByTime(1000);
    control(other.rooms, other.code, 'pause');
    jest.advanceTimersByTime(5000);
    const kept = other.rooms.read(other.code, token(2));
    expect(kept.game!.paused).toBe(true);
    expect(kept.game!.resumeAt).toBeUndefined();
    expect(kept.game!.remainingMs).toBe(first.game!.remainingMs);
  });
  it('pauses five seconds after host loss, restores presence without unpausing and expires after ten minutes', () => {
    const { rooms, code } = setup();
    const socket = Symbol();
    rooms.socketOpened(code, token(1), socket);
    rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
    rooms.socketClosed(code, token(1), socket);
    jest.advanceTimersByTime(4999);
    expect(rooms.read(code, token(2)).game!.paused).toBe(false);
    jest.advanceTimersByTime(1);
    expect(rooms.read(code, token(2)).game).toMatchObject({
      paused: true,
      pauseReason: 'host_disconnected',
      remainingMs: 25000,
    });
    jest.advanceTimersByTime(120000);
    const restored = rooms.read(code, token(1));
    rooms.socketOpened(code, token(1), socket);
    expect(restored.hostConnected).toBe(true);
    expect(restored.game!.paused).toBe(true);
    control(rooms, code, 'resume');
    jest.advanceTimersByTime(3000);
    rooms.read(code, token(1));
    expect(rooms.read(code, token(2)).game!.paused).toBe(false);
    rooms.socketClosed(code, token(1), socket);
    jest.advanceTimersByTime(599999);
    expect(rooms.read(code, token(2)).status).toBe('playing');
    jest.advanceTimersByTime(1);
    expect(rooms.read(code, token(1)).status).toBe('closed');
  });
  it('detects silent host loss and respects multiple host sockets and customized grace/retention', () => {
    const { rooms, code } = setup(
      'individual',
      'automatic',
      recoverySettings({
        ...recoverySettings(),
        hostGraceSeconds: 2,
        hostRetentionMinutes: 1,
      }),
    );
    const a = Symbol(),
      b = Symbol();
    rooms.socketOpened(code, token(1), a);
    rooms.socketOpened(code, token(1), b);
    rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
    rooms.socketClosed(code, token(1), a);
    jest.advanceTimersByTime(1000);
    rooms.read(code, token(1));
    expect(rooms.read(code, token(2)).hostConnected).toBe(true);
    jest.advanceTimersByTime(2000);
    expect(rooms.read(code, token(2)).game!.paused).toBe(true);
    jest.advanceTimersByTime(58000);
    expect(rooms.read(code, token(2)).status).toBe('closed');
  });
  it('freezes board choice and recovery settings after start and keeps snapshot profiles isolated', () => {
    const { rooms, code } = setup();
    control(rooms, code, 'pause');
    expect(rooms.read(code, token(2)).game!.board).toEqual([]);
    expect(() =>
      rooms.action(code, token(2), { action: 'choose', questionId: 'q' }),
    ).toThrow();
    expect(() =>
      rooms.configure(code, token(1), { recoverySettings: recoverySettings() }),
    ).toThrow();
    const copy = rooms.read(code, token(1));
    copy.recoverySettings.hostGraceSeconds = 0;
    expect(rooms.read(code, token(1)).recoverySettings.hostGraceSeconds).toBe(
      5,
    );
  });
  it('does not restart custom grace when a silent transport is eventually closed', () => {
    const { rooms, code } = setup(
      'individual',
      'automatic',
      recoverySettings({
        ...recoverySettings(),
        hostGraceSeconds: 25,
        hostRetentionMinutes: 1,
      }),
    );
    const socket = Symbol();
    rooms.socketOpened(code, token(1), socket);
    rooms.action(code, token(2), { action: 'choose', questionId: 'q' });
    jest.advanceTimersByTime(1500);
    expect(rooms.read(code, token(2)).hostConnected).toBe(false);
    expect(rooms.read(code, token(2)).game!.paused).toBe(false);
    jest.advanceTimersByTime(18500);
    rooms.socketClosed(code, token(1), socket);
    jest.advanceTimersByTime(5000);
    expect(rooms.read(code, token(2)).game).toMatchObject({
      paused: true,
      remainingMs: 5000,
      pauseReason: 'host_disconnected',
    });
  });
});
