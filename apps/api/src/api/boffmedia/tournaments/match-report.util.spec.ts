import {
  effectiveBestOf,
  flipGames,
  gamesToScores,
  validGamesString,
} from './match-report.util';

describe('effectiveBestOf', () => {
  const single = { format: 'single', bestOf: 3, finalsBestOf: 5 };
  const dbl = { format: 'double', bestOf: 3, finalsBestOf: 5 };

  it('uses finalsBestOf only on the last winners round of a single phase', () => {
    expect(
      effectiveBestOf({ bracket: 'winners', roundNumber: 3 }, single, 1, 3),
    ).toBe(5);
    expect(
      effectiveBestOf({ bracket: 'winners', roundNumber: 2 }, single, 1, 3),
    ).toBe(3);
  });

  it('double phases escalate only the grand final, never the WB final', () => {
    expect(
      effectiveBestOf({ bracket: 'grand', roundNumber: 1 }, dbl, 1, 3),
    ).toBe(5);
    expect(
      effectiveBestOf({ bracket: 'winners', roundNumber: 3 }, dbl, 1, 3),
    ).toBe(3);
  });

  it('third-place matches keep the base best-of', () => {
    expect(
      effectiveBestOf({ bracket: 'third', roundNumber: 1 }, single, 1, 3),
    ).toBe(3);
  });

  it('falls back phase.bestOf → tournament bestOf without finalsBestOf', () => {
    expect(
      effectiveBestOf(
        { bracket: 'winners', roundNumber: 3 },
        { format: 'single', bestOf: null, finalsBestOf: null },
        1,
        3,
      ),
    ).toBe(1);
    expect(
      effectiveBestOf({ bracket: 'swiss', roundNumber: 1 }, null, 3, 0),
    ).toBe(3);
  });
});

describe('games strings', () => {
  it('tallies and flips perspectives', () => {
    expect(gamesToScores('WLW')).toEqual({ wins: 2, losses: 1 });
    expect(flipGames('WLW')).toBe('LWL');
    expect(flipGames(flipGames('WWL'))).toBe('WWL');
  });

  it('accepts decisive best-of results only', () => {
    expect(validGamesString('W', 1)).toBe(true);
    expect(validGamesString('WW', 3)).toBe(true);
    expect(validGamesString('WLW', 3)).toBe(true);
    expect(validGamesString('LL', 3)).toBe(true);
  });

  it('rejects incomplete, over-length, post-decision and malformed strings', () => {
    expect(validGamesString('WL', 3)).toBe(false); // not decisive
    expect(validGamesString('WWL', 3)).toBe(false); // game after decision
    expect(validGamesString('WWWW', 5)).toBe(false); // game after decision
    expect(validGamesString('WLWL', 3)).toBe(false); // too long
    expect(validGamesString('WDW', 3)).toBe(false); // bad char
    expect(validGamesString('', 3)).toBe(false);
  });
});
