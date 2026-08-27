import { BadRequestException, Injectable } from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import {
  Tournament,
  TournamentParticipant,
  TOURNAMENT_PARTICIPANT_STATUS,
} from '@/_db/schema/BoffMediaTournaments';

/** Why a registered player is not yet an entrant. Empty array = entered. */
export type EntryGap = 'check-in' | 'teamsheet';

export interface EntryResolution {
  entered: number[];
  dropped: number[];
}

/**
 * Who actually plays.
 *
 * Registering is an intention; entering is the commitment the pairings are
 * built from. A player enters by checking in, and — when the tournament sets
 * `teamsheetRequired` (VGC) — by submitting a teamsheet as well. Everyone still
 * short of that when the field is resolved is `dropped`: kept as a row, out of
 * the bracket, re-admittable by an admin until the bracket exists.
 *
 * Resolution is the same operation whether it is triggered by the entry
 * deadline or by generate, so both go through `resolve`.
 */
@Injectable()
export class EntryService {
  constructor(private readonly repo: TournamentsRepository) {}

  /** What a given registration is still missing, in the order a player fixes it. */
  gapsFor(t: Tournament, p: TournamentParticipant): EntryGap[] {
    const gaps: EntryGap[] = [];
    if (t.teamsheetRequired && !p.teamsheet) gaps.push('teamsheet');
    if (p.checkedInAt == null) gaps.push('check-in');
    return gaps;
  }

  /** True when this registration counts as an entrant right now. */
  hasEntered(t: Tournament, p: TournamentParticipant): boolean {
    return this.gapsFor(t, p).length === 0;
  }

  /**
   * Freeze the field: everyone still active but not entered becomes `dropped`,
   * teamsheets lock, and both entry windows close.
   *
   * Runs in one transaction under the tournament row lock, so it cannot
   * interleave with a check-in landing at the deadline — a player either made
   * it before the lock or did not.
   */
  async resolve(tournamentId: number): Promise<EntryResolution> {
    return this.repo.transaction(async (tx) => {
      const t = await tx.lockTournament(tournamentId);
      if (!t) throw new BadRequestException('Tournament not found');

      const participants = await tx.listParticipants(tournamentId);
      const active = participants.filter(
        (p) => p.status === TOURNAMENT_PARTICIPANT_STATUS.ACTIVE,
      );

      const entered: number[] = [];
      const dropped: number[] = [];
      for (const p of active) {
        if (this.hasEntered(t, p)) entered.push(p.id);
        else dropped.push(p.id);
      }

      for (const id of dropped) {
        await tx.updateParticipant(id, {
          status: TOURNAMENT_PARTICIPANT_STATUS.DROPPED,
        });
      }

      await tx.update(tournamentId, {
        teamsheetLockedAt: t.teamsheetLockedAt ?? new Date(),
        registrationOpen: false,
        checkInOpen: false,
      });

      return { entered, dropped };
    });
  }

  /**
   * Re-admit a dropped entrant. Allowed only before the bracket exists: after
   * that the field is what the pairings were built from, and adding a player
   * back would need a regenerate anyway.
   */
  async readmit(
    tournamentId: number,
    participantId: number,
  ): Promise<{ success: boolean }> {
    const matches = await this.repo.listMatches(tournamentId);
    if (matches.length > 0) {
      throw new BadRequestException(
        'The bracket is already built — regenerate it to change the field',
      );
    }
    const p = await this.repo.findParticipant(participantId);
    if (!p || p.tournamentId !== tournamentId) {
      throw new BadRequestException('Participant not found');
    }
    if (p.status !== TOURNAMENT_PARTICIPANT_STATUS.DROPPED) {
      throw new BadRequestException('That entrant was not dropped');
    }
    await this.repo.updateParticipant(participantId, {
      status: TOURNAMENT_PARTICIPANT_STATUS.ACTIVE,
    });
    return { success: true };
  }

  /**
   * Preview for the admin's generate button: how the field splits right now,
   * without changing anything.
   */
  async preview(tournamentId: number): Promise<EntryResolution> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new BadRequestException('Tournament not found');
    const participants = await this.repo.listParticipants(tournamentId);
    const entered: number[] = [];
    const dropped: number[] = [];
    for (const p of participants) {
      if (p.status !== TOURNAMENT_PARTICIPANT_STATUS.ACTIVE) continue;
      if (this.hasEntered(t, p)) entered.push(p.id);
      else dropped.push(p.id);
    }
    return { entered, dropped };
  }
}
