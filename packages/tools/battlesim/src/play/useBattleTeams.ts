"use client";

/**
 * Picks the two teams a local battle starts with (D13).
 *
 * A random format needs neither side supplied — the generator builds both. A
 * team format needs BOTH, and this is where they come from:
 *
 *   yours  — the team you selected, or your most recently edited one for the
 *            format if you have not chosen.
 *   bot's  — one of your OTHER teams in that format, so the AI plays something
 *            you actually built, falling back to the bundled sample when that
 *            is your only team (which it is, the first time).
 *
 * The fallback matters more than it sounds: without it, picking a team format
 * with exactly one saved team hands the engine an undefined side and the battle
 * fails to start, which is what the old lobby did every time someone chose
 * National Dex.
 */

import { useCallback, useMemo } from "react";
import { importPaste, packTeam, sampleTeamFor } from "@boffmedia/battle-core";

import { isTeamFormat } from "../lib/bsim-data";
import type { TeamRecord } from "@boffmedia/battle-core";

export interface BattleTeams {
  p1Team?: string;
  p2Team?: string;
}

export interface UseBattleTeams {
  /** Your teams for this format, most recent first. */
  available: TeamRecord[];
  /** Whether this format needs a team at all. */
  needsTeam: boolean;
  /** True when the format needs a team and nothing can supply one. */
  blocked: boolean;
  /** The packed pair to hand `createBattle`. */
  teamsFor(selectedClientId: string | null): BattleTeams;
}

export function useBattleTeams(format: string, teams: TeamRecord[]): UseBattleTeams {
  const needsTeam = isTeamFormat(format);

  const available = useMemo(
    () =>
      teams
        .filter((t) => t.format === format && !t.deletedAt && t.packed)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [teams, format],
  );

  // The bundled samples are Showdown PASTES; a stored team is PACKED, and the
  // worker unpacks whatever it is given. Handing it a paste made `unpackTeam`
  // return null and the engine refuse the battle with "requires a packed team
  // for both sides" — which is the engine being right about a caller being
  // wrong. Converted once per format rather than per launch.
  const sample = useMemo(() => {
    const paste = sampleTeamFor(format);
    if (!paste) return null;
    const sets = importPaste(paste);
    return sets ? packTeam(sets) : null;
  }, [format]);

  const teamsFor = useCallback(
    (selectedClientId: string | null): BattleTeams => {
      if (!needsTeam) return {};

      const mine =
        available.find((t) => t.clientId === selectedClientId) ?? available[0] ?? null;
      // The bot gets a DIFFERENT team of yours where possible; mirror matches
      // against your own exact team are a poor first experience.
      const theirs = available.find((t) => t.clientId !== mine?.clientId) ?? null;

      return {
        p1Team: mine?.packed ?? sample ?? undefined,
        p2Team: theirs?.packed ?? sample ?? mine?.packed ?? undefined,
      };
    },
    [needsTeam, available, sample],
  );

  // A team format with no team of yours AND no bundled sample cannot start.
  // `gen9teras` is the live case: its sample lands with the random generator in M4.
  const blocked = needsTeam && available.length === 0 && !sample;

  return { available, needsTeam, blocked, teamsFor };
}
