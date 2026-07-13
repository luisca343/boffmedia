import {
  computeStandings,
  standingsForEntrants,
  matchesForPhaseChain,
} from './standings.util';
import type { TournamentMatch } from '@/_db/schema/Tournaments';

let seq = 1;
function match(part: Partial<TournamentMatch>): TournamentMatch {
  return {
    id: seq++,
    tournamentId: 1,
    phaseId: null,
    bracket: 'swiss',
    groupId: null,
    roundNumber: 1,
    position: 0,
    topParticipantId: null,
    botParticipantId: null,
    topScore: null,
    botScore: null,
    winnerParticipantId: null,
    status: 'completed',
    nextMatchId: null,
    nextMatchSlot: null,
    loserNextMatchId: null,
    loserNextMatchSlot: null,
    scheduledAt: null,
    reportedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...part,
  } as TournamentMatch;
}
/** a beats b, 1-0. */
const win = (a: number, b: number, extra: Partial<TournamentMatch> = {}) =>
  match({
    topParticipantId: a,
    botParticipantId: b,
    winnerParticipantId: a,
    topScore: 1,
    botScore: 0,
    ...extra,
  });
const rankOf = (rows: { participantId: number; rank: number }[], id: number) =>
  rows.find((r) => r.participantId === id)!.rank;

describe('computeStandings', () => {
  it('counts a bye as a 3-point win that also counts as played', () => {
    const bye = match({
      status: 'bye',
      topParticipantId: 1,
      botParticipantId: null,
      winnerParticipantId: 1,
    });
    const rows = computeStandings([1, 2], [bye]);
    const p1 = rows.find((r) => r.participantId === 1)!;
    expect(p1.pts).toBe(3);
    expect(p1.w).toBe(1);
    expect(p1.played).toBe(1);
    expect(rows.find((r) => r.participantId === 2)!.pts).toBe(0);
  });

  it('awards 3 for a win, 1 each for a draw, 0 for a loss', () => {
    const rows = computeStandings(
      [1, 2, 3, 4],
      [
        win(1, 2),
        match({
          topParticipantId: 3,
          botParticipantId: 4,
          winnerParticipantId: null,
          topScore: 1,
          botScore: 1,
        }),
      ],
    );
    expect(rows.find((r) => r.participantId === 1)!.pts).toBe(3);
    expect(rows.find((r) => r.participantId === 2)!.pts).toBe(0);
    expect(rows.find((r) => r.participantId === 3)!.d).toBe(1);
    expect(rows.find((r) => r.participantId === 4)!.pts).toBe(1);
  });

  it('breaks point ties differently under points vs resistance', () => {
    // 5 and 6 both go 1-0. 6's opponent (2) is stronger than 5's opponent (1),
    // so resistance favours 6; the points profile falls back to id and favours 5.
    const matches = [win(5, 1), win(6, 2), win(2, 3), win(4, 1)];
    const ids = [1, 2, 3, 4, 5, 6];

    const byPoints = computeStandings(ids, matches, 'points');
    expect(rankOf(byPoints, 5)).toBeLessThan(rankOf(byPoints, 6));

    const byResistance = computeStandings(ids, matches, 'resistance');
    expect(rankOf(byResistance, 6)).toBeLessThan(rankOf(byResistance, 5));
  });
});

describe('standingsForEntrants', () => {
  it('keeps an entrant’s full record, including games vs eliminated players', () => {
    // Day 1: p1 beats p3, p3 beats p2 (p2 loses to a player who won’t qualify).
    // Day 2: p1 beats p2. Entrants for the ranking are only {1,2}.
    const chain = [win(1, 3), win(3, 2), win(1, 2)];
    const rows = standingsForEntrants([1, 2], [1, 2, 3], chain);

    const p2 = rows.find((r) => r.participantId === 2)!;
    // Naively restricting to {1,2} would drop the p3→p2 loss and show 0-1.
    expect(p2.l).toBe(2);
    expect(rows.find((r) => r.participantId === 1)!.w).toBe(2);
    expect(rows.map((r) => r.rank)).toEqual([1, 2]);
  });
});

describe('matchesForPhaseChain', () => {
  const phases = [
    { id: 10, phaseOrder: 1, carryStandings: false },
    { id: 20, phaseOrder: 2, carryStandings: true },
    { id: 30, phaseOrder: 3, carryStandings: false },
  ];
  const all = [
    win(1, 2, { phaseId: 10 }),
    win(1, 3, { phaseId: 10 }),
    win(1, 2, { phaseId: 20 }),
    win(1, 2, { phaseId: 30 }),
  ];

  it('includes the previous phase when carryStandings is set', () => {
    expect(matchesForPhaseChain(20, phases, all)).toHaveLength(3); // phase 20 (1) + phase 10 (2)
  });
  it('stops at the phase itself when carry is off', () => {
    expect(matchesForPhaseChain(10, phases, all)).toHaveLength(2);
    expect(matchesForPhaseChain(30, phases, all)).toHaveLength(1);
  });
});
