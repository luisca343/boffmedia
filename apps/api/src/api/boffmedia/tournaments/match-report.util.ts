/**
 * Pure helpers shared by the report path (admin + self-report proposals) and
 * the standings view builders.
 */

/**
 * Games per match for one concrete match. The phase's `finalsBestOf` overrides
 * only the decisive match: the grand final of a double phase, or the last
 * winners round of a single phase. Third-place playoffs keep the base best-of.
 */
export function effectiveBestOf(
  match: { bracket: string; roundNumber: number },
  phase: {
    format: string;
    bestOf: number | null;
    finalsBestOf: number | null;
  } | null,
  tournamentBestOf: number,
  maxWinnersRound: number,
): number {
  const base = phase?.bestOf ?? tournamentBestOf;
  if (phase?.finalsBestOf == null) return base;
  const isFinals =
    match.bracket === 'grand' ||
    (phase.format === 'single' &&
      match.bracket === 'winners' &&
      match.roundNumber === maxWinnersRound);
  return isFinals ? phase.finalsBestOf : base;
}

/** 'W'/'L' tallies of a games string, from its writer's perspective. */
export function gamesToScores(games: string): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const c of games) {
    if (c === 'W') wins++;
    else if (c === 'L') losses++;
  }
  return { wins, losses };
}

/** Flip a games string to the other player's perspective (W↔L). */
export function flipGames(games: string): string {
  return [...games].map((c) => (c === 'W' ? 'L' : c === 'L' ? 'W' : c)).join('');
}

/**
 * A valid self-reported games string for a best-of-N match: only W/L chars, a
 * decisive result (someone reaches the majority), no game recorded after the
 * decision, and no more than N games. Draws are not expressible — league draws
 * go through an admin.
 */
export function validGamesString(games: string, bestOf: number): boolean {
  if (!/^[WL]+$/.test(games)) return false;
  if (games.length > bestOf) return false;
  const majority = Math.ceil(bestOf / 2);
  let w = 0;
  let l = 0;
  for (let i = 0; i < games.length; i++) {
    if (w >= majority || l >= majority) return false; // play after decision
    if (games[i] === 'W') w++;
    else l++;
  }
  return w >= majority || l >= majority;
}
