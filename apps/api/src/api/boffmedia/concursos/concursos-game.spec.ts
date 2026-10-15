import { ConcursosRoomsService } from './concursos-rooms.service';
import type { ConcursosQuestionDto } from './concursos.dto';
const token = (n: number) => n.toString(16).padStart(48, '0');
const questions: ConcursosQuestionDto[] = [
  {
    id: 'q1',
    category: 'Science',
    prompt: 'Planet?',
    choices: ['Venus', 'Mars', 'Earth', 'Jupiter'],
    correctIndex: 1,
    seconds: 5,
    points: 25,
    phaseIndex: 0,
    phaseTitle: 'First',
  },
  {
    id: 'q2',
    category: 'Science',
    prompt: 'Sides?',
    choices: ['4', '5', '6', '8'],
    correctIndex: 2,
    seconds: 5,
    points: 25,
    phaseIndex: 0,
    phaseTitle: 'First',
  },
  {
    id: 'q3',
    category: 'World',
    prompt: 'Continent?',
    choices: ['Europe', 'Asia', 'America', 'Africa'],
    correctIndex: 2,
    seconds: 5,
    points: 100,
    phaseIndex: 1,
    phaseTitle: 'Second',
  },
];
function setup(mode: 'individual' | 'teams', count = 4) {
  const rooms = new ConcursosRoomsService();
  const { code } = rooms.create(token(1), 'local');
  rooms.configure(code, token(1), { pacing: 'directed' });
  const ids = Array.from(
    { length: count },
    (_, index) =>
      rooms.join(code, token(index + 2), 'Player ' + index).memberId!,
  );
  if (mode === 'teams') {
    rooms.configure(code, token(1), mode);
    ids.forEach((_, index) =>
      rooms.group(code, token(index + 2), index < 2 ? 'team-1' : 'team-2'),
    );
  }
  // This suite exercises gameplay with present participants; loss is covered separately.
  setInterval(
    () => ids.forEach((_, index) => rooms.read(code, token(index + 2))),
    1000,
  );
  return { rooms, code, ids };
}
describe('Common individual and team question engine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T08:00:00Z'));
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it('individual creates one scoring entity per person and scores exactly once', () => {
    const { rooms, code, ids } = setup('individual', 4);
    rooms.startGame(code, token(1), { questions });
    expect(rooms.read(code, token(2)).entities.map((e) => e.memberIds)).toEqual(
      ids.map((id) => [id]),
    );
    expect(
      rooms
        .read(code, token(2))
        .entities.every((entity) => !('captainId' in entity)),
    ).toBe(true);
    const chosen = rooms.action(code, token(2), {
      action: 'choose',
      questionId: 'q1',
    });
    expect(chosen.game!.question).not.toHaveProperty('correctIndex');
    expect(() =>
      rooms.action(code, token(2), {
        action: 'propose',
        roundId: 1,
        choice: 1,
      }),
    ).toThrow();
    for (let i = 0; i < 4; i++)
      rooms.action(code, token(i + 2), {
        action: 'answer',
        roundId: 1,
        choice: i === 1 ? 0 : 1,
      });
    let result = rooms.read(code, token(1));
    expect(result.game!.stage).toBe('result');
    expect(result.entities.map((e) => e.score)).toEqual([25, 0, 25, 25]);
    rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 });
    result = rooms.read(code, token(1));
    expect(result.entities[0].score).toBe(25);
    expect(() =>
      rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 0 }),
    ).toThrow();
  });
  it('only the selector acts and future phases/answers are not exposed', () => {
    const { rooms, code } = setup('individual', 2);
    const room = rooms.startGame(code, token(1), { questions });
    expect(room.game!.board.map((q) => q.id)).toEqual(['q1', 'q2']);
    expect(JSON.stringify(room.game)).not.toContain('correctIndex');
    expect(() =>
      rooms.action(code, token(3), { action: 'choose', questionId: 'q1' }),
    ).toThrow();
    expect(() =>
      rooms.action(code, token(2), { action: 'choose', questionId: 'q3' }),
    ).toThrow();
    expect(() =>
      rooms.action(code, token(1), { action: 'choose', questionId: 'q1' }),
    ).toThrow();
  });
  it('team proposals are visible only inside their own entity, including reconnect', () => {
    const { rooms, code, ids } = setup('teams');
    rooms.startGame(code, token(1), { questions });
    rooms.action(code, token(2), { action: 'choose', questionId: 'q1' });
    rooms.action(code, token(3), { action: 'propose', roundId: 1, choice: 2 });
    rooms.action(code, token(2), { action: 'propose', roundId: 1, choice: 1 });
    expect(rooms.read(code, token(2)).game!.own!.proposals).toEqual([
      { memberId: ids[0], choice: 1 },
      { memberId: ids[1], choice: 2 },
    ]);
    expect(rooms.read(code, token(4)).game!.own!.proposals).toEqual([]);
    expect(rooms.read(code, token(1)).game).not.toHaveProperty('own');
    expect(
      rooms.join(code, token(3), 'Player 1').game!.own!.proposals,
    ).toHaveLength(2);
    expect(() =>
      rooms.action(code, token(3), { action: 'answer', roundId: 1, choice: 1 }),
    ).toThrow();
    rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 });
    expect(rooms.read(code, token(4)).game!.own).not.toHaveProperty('answer');
    expect(rooms.read(code, token(4)).game!.question).not.toHaveProperty(
      'correctIndex',
    );
    rooms.action(code, token(4), { action: 'answer', roundId: 1, choice: 0 });
    expect(rooms.read(code, token(1)).entities.map((e) => e.score)).toEqual([
      25, 0,
    ]);
  });
  it('server deadline rejects late submissions and preserves timeout result on reconnect', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.startGame(code, token(1), { questions });
    rooms.action(code, token(2), { action: 'choose', questionId: 'q1' });
    rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 });
    jest.advanceTimersByTime(5000);
    expect(() =>
      rooms.action(code, token(3), { action: 'answer', roundId: 1, choice: 1 }),
    ).toThrow();
    const result = rooms.read(code, token(3));
    expect(result.game!.stage).toBe('result');
    expect(result.entities.map((e) => e.score)).toEqual([25, 0]);
    expect(result.game!.results![1]).not.toHaveProperty('answer');
  });
  it('lost choose and next replies are idempotent and cannot reset deadlines or skip questions', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.startGame(code, token(1), { questions });
    const first = rooms.action(code, token(2), {
      action: 'choose',
      questionId: 'q1',
    });
    jest.advanceTimersByTime(1000);
    expect(
      rooms.action(code, token(2), { action: 'choose', questionId: 'q1' }).game!
        .deadlineAt,
    ).toBe(first.game!.deadlineAt);
    jest.advanceTimersByTime(4000);
    rooms.action(code, token(1), { action: 'next', roundId: 1 });
    rooms.action(code, token(1), { action: 'next', roundId: 1 });
    expect(rooms.read(code, token(1)).game!.board.map((q) => q.id)).toEqual([
      'q2',
    ]);
    rooms.action(code, token(3), {
      action: 'choose',
      questionId: 'q2',
      selectionRevision: 1,
    });
    expect(() =>
      rooms.action(code, token(1), { action: 'next', roundId: 1 }),
    ).toThrow();
    expect(() =>
      rooms.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 }),
    ).toThrow();
  });
  it('rotates team captains at the safe boundary and rejects the former role', () => {
    const { rooms, code, ids } = setup('teams');
    rooms.startGame(code, token(1), { questions });
    rooms.action(code, token(2), { action: 'choose', questionId: 'q1' });
    jest.advanceTimersByTime(5000);
    rooms.action(code, token(1), { action: 'next', roundId: 1 });
    expect(rooms.read(code, token(1)).entities.map((e) => e.captainId)).toEqual(
      [ids[1], ids[3]],
    );
    expect(() =>
      rooms.action(code, token(4), { action: 'choose', questionId: 'q2' }),
    ).toThrow();
    rooms.action(code, token(5), {
      action: 'choose',
      questionId: 'q2',
      selectionRevision: 1,
      captainRevision: 1,
    });
    expect(() =>
      rooms.action(code, token(2), { action: 'answer', roundId: 2, choice: 2 }),
    ).toThrow();
    rooms.action(code, token(3), {
      action: 'answer',
      roundId: 2,
      choice: 2,
      captainRevision: 1,
    });
  });
  it('locks composition/mode while playing and refuses new players', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.startGame(code, token(1), { questions });
    expect(() => rooms.configure(code, token(1), 'teams')).toThrow();
    expect(() => rooms.leave(code, token(2))).toThrow();
    expect(() => rooms.join(code, token(9), 'New')).toThrow();
    expect(() =>
      rooms.action(code, token(9), { action: 'answer', roundId: 1, choice: 1 }),
    ).toThrow();
    expect(() => rooms.startGame(code, token(2), { questions })).toThrow();
  });
  it('requires two entities and all team members assigned before starting', () => {
    const { rooms, code } = setup('individual', 1);
    expect(() => rooms.startGame(code, token(1), { questions })).toThrow();
    rooms.join(code, token(3), 'Other');
    rooms.configure(code, token(1), 'teams');
    expect(() => rooms.startGame(code, token(1), { questions })).toThrow();
    rooms.group(code, token(2), 'team-1');
    rooms.group(code, token(3), 'team-2');
    expect(rooms.startGame(code, token(1), { questions }).game!.stage).toBe(
      'board',
    );
  });
  it('supports one member in a team and cumulative scores across phases', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.configure(code, token(1), 'teams');
    rooms.group(code, token(2), 'team-1');
    rooms.group(code, token(3), 'team-2');
    rooms.startGame(code, token(1), { questions });
    questions.forEach((q, index) => {
      rooms.action(code, token((index % 2) + 2), {
        action: 'choose',
        questionId: q.id,
        selectionRevision: index,
        captainRevision: index,
      });
      rooms.action(code, token(2), {
        action: 'answer',
        roundId: index + 1,
        captainRevision: index,
        choice: q.correctIndex,
      });
      rooms.action(code, token(3), {
        action: 'answer',
        roundId: index + 1,
        captainRevision: index,
        choice: 0,
      });
      rooms.action(code, token(1), { action: 'next', roundId: index + 1 });
    });
    const final = rooms.read(code, token(1));
    expect(final.game!.stage).toBe('finished');
    expect(final.entities.map((e) => e.score)).toEqual([150, 0]);
  });
  it('host may close an active game without disclosing unanswered solutions', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.startGame(code, token(1), { questions });
    rooms.action(code, token(2), { action: 'choose', questionId: 'q1' });
    rooms.close(code, token(1));
    const room = rooms.read(code, token(2));
    expect(room.status).toBe('closed');
    expect(room).not.toHaveProperty('game');
  });
  it('authenticated actions refresh presence without adding time to the question', () => {
    const { rooms, code, ids } = setup('teams');
    const longQuestion = { ...questions[0], seconds: 30 };
    rooms.startGame(code, token(1), { questions: [longQuestion] });
    const opened = rooms.action(code, token(2), {
      action: 'choose',
      questionId: 'q1',
    });
    jest.advanceTimersByTime(16000);
    const active = rooms.action(code, token(3), {
      action: 'propose',
      roundId: 1,
      choice: 1,
    });
    expect(
      active.members.find((member) => member.id === ids[1])!.connected,
    ).toBe(true);
    expect(active.game!.deadlineAt).toBe(opened.game!.deadlineAt);
  });
});

describe('Automatic and directed result pacing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T08:00:00Z'));
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it('defaults to automatic eight-second results and freezes lobby settings at start', () => {
    const rooms = new ConcursosRoomsService();
    const { code } = rooms.create(token(1), 'qa');
    expect(rooms.read(code, token(1))).toMatchObject({
      pacing: 'automatic',
      resultSeconds: 8,
      mode: 'individual',
    });
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    rooms.startGame(code, token(1), { questions });
    expect(() =>
      rooms.configure(code, token(1), { pacing: 'directed' }),
    ).toThrow();
    expect(() =>
      rooms.configure(code, token(1), { resultSeconds: 3 }),
    ).toThrow();
    expect(rooms.read(code, token(2)).game).toMatchObject({
      pacing: 'automatic',
      resultSeconds: 8,
    });
  });
  it.each(['individual', 'teams'] as const)(
    'automatically advances %s across phases, rotates once and ends without host next commands',
    (mode) => {
      const { rooms, code, ids } = setup(mode);
      rooms.configure(code, token(1), {
        pacing: 'automatic',
        resultSeconds: 3,
      });
      rooms.startGame(code, token(1), { questions });
      let priorScore = 0;
      for (const [index, question] of questions.entries()) {
        const board = rooms.read(code, token(1));
        const selector = board.entities.find(
          (e) => e.id === board.game!.selectorId,
        )!;
        const chooser =
          mode === 'individual' ? selector.memberIds[0] : selector.captainId!;
        rooms.action(code, token(ids.indexOf(chooser) + 2), {
          action: 'choose',
          questionId: question.id,
          selectionRevision: board.game!.selectionRevision,
          captainRevision: selector.captainRevision,
        });
        for (const [entityIndex, entity] of board.entities.entries()) {
          const actor =
            mode === 'individual' ? entity.memberIds[0] : entity.captainId!;
          rooms.action(code, token(ids.indexOf(actor) + 2), {
            action: 'answer',
            roundId: index + 1,
            captainRevision: entity.captainRevision,
            choice: entityIndex === 0 ? question.correctIndex : 0,
          });
        }
        const result = rooms.read(code, token(1));
        expect(result.game!.stage).toBe('result');
        expect(result.game!.results![0].points).toBe(question.points);
        expect(result.game!.results![1].points).toBe(0);
        expect(result.game!.advanceAt).toBe(Date.now() + 3000);
        priorScore += question.points;
        expect(result.entities[0].score).toBe(priorScore);
        const deadline = result.game!.advanceAt;
        expect(() =>
          rooms.action(code, token(1), { action: 'next', roundId: index + 1 }),
        ).toThrow();
        jest.advanceTimersByTime(2999);
        expect(rooms.read(code, token(2)).game!.advanceAt).toBe(deadline);
        expect(rooms.read(code, token(1)).game!.stage).toBe('result');
        jest.advanceTimersByTime(1);
        const advanced = rooms.read(code, token(1));
        expect(advanced.game!.stage).toBe(index === 2 ? 'finished' : 'board');
        expect(advanced.game!.advanceAt).toBeUndefined();
        expect(advanced.game!.deadlineAt).toBeUndefined();
        expect(advanced.game!.own).toBeUndefined();
        expect(advanced.entities[0].score).toBe(priorScore);
        if (mode === 'teams' && index === 0)
          expect(advanced.entities[0].captainId).toBe(ids[1]);
        expect(rooms.read(code, token(1)).entities).toEqual(advanced.entities);
        expect(() =>
          rooms.action(code, token(2), {
            action: 'answer',
            roundId: index + 1,
            choice: question.correctIndex,
          }),
        ).toThrow();
      }
    },
  );
  it('anchors timeout results to the question deadline and catches up without extending results on reads', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.configure(code, token(1), { pacing: 'automatic', resultSeconds: 8 });
    rooms.startGame(code, token(1), { questions: [questions[0]] });
    const open = rooms.action(code, token(2), {
      action: 'choose',
      questionId: 'q1',
    });
    jest.advanceTimersByTime(7000);
    const result = rooms.read(code, token(3));
    expect(result.game!.advanceAt).toBe(open.game!.deadlineAt! + 8000);
    expect(result.game!.stage).toBe('result');
    jest.advanceTimersByTime(6000);
    expect(rooms.read(code, token(1)).game!.stage).toBe('finished');
    expect(rooms.read(code, token(1)).entities.map((e) => e.score)).toEqual([
      0, 0,
    ]);
  });
  it('directed results wait for the host and pacing changes preserve participation and result duration', () => {
    const { rooms, code } = setup('individual', 2);
    rooms.configure(code, token(1), { resultSeconds: 12 });
    rooms.configure(code, token(1), { pacing: 'automatic' });
    rooms.configure(code, token(1), { pacing: 'directed' });
    expect(rooms.read(code, token(1))).toMatchObject({
      mode: 'individual',
      pacing: 'directed',
      resultSeconds: 12,
    });
    rooms.startGame(code, token(1), { questions });
    rooms.action(code, token(2), { action: 'choose', questionId: 'q1' });
    jest.advanceTimersByTime(25000);
    expect(rooms.read(code, token(1)).game!.stage).toBe('result');
    expect(rooms.read(code, token(1)).game!.advanceAt).toBeUndefined();
    expect(() =>
      rooms.action(code, token(2), { action: 'next', roundId: 1 }),
    ).toThrow();
    rooms.action(code, token(1), { action: 'next', roundId: 1 });
    expect(rooms.read(code, token(1)).game!.stage).toBe('board');
  });
  it('rejects empty/null/out-of-range lobby settings and non-host changes without partial updates', () => {
    const { rooms, code } = setup('individual', 2);
    const before = rooms.read(code, token(1));
    for (const body of [
      {},
      { resultSeconds: 0 },
      { resultSeconds: 31 },
      { resultSeconds: 3.5 },
      { pacing: null },
      { mode: null },
    ]) {
      expect(() => rooms.configure(code, token(1), body as never)).toThrow();
    }
    expect(() =>
      rooms.configure(code, token(2), { pacing: 'automatic' }),
    ).toThrow();
    expect(rooms.read(code, token(1))).toEqual(before);
  });
});
