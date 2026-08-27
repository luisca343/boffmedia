import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, isNotNull, isNull, lt, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaEventInvites,
  boffMediaEvents,
  EVENT_STATUS,
} from '@/_db/schema/BoffMediaEvents';
import { boffMediaTournaments } from '@/_db/schema/BoffMediaTournaments';
import { randomizerConfigs } from '@/_db/schema/Randomizer';

/**
 * Queries for the events/tournaments lifecycle sweep.
 *
 * Schema-level import of `randomizerConfigs` only, exactly like
 * `EventsRepository`: depending on the randomizer *module* here would close a
 * cycle, since the randomizer already depends on events.
 */
@Injectable()
export class LifecycleSweeperRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Events whose start date has arrived while they are still `upcoming`.
   * Returned rather than updated in bulk so the sweeper can log and audit each
   * one — a status change is exactly the kind of thing you want a trail for.
   */
  async findEventsDueToActivate(now: Date): Promise<{ id: number }[]> {
    return this.db
      .select({ id: boffMediaEvents.id })
      .from(boffMediaEvents)
      .where(
        and(
          eq(boffMediaEvents.status, EVENT_STATUS.UPCOMING),
          isNull(boffMediaEvents.deletedAt),
          isNotNull(boffMediaEvents.startDate),
          lte(boffMediaEvents.startDate, now),
        ),
      );
  }

  /**
   * Tournaments past their start date that still advertise an open window.
   * `generate` closes both windows too; this is for the tournament that has not
   * been generated yet, whose page would otherwise keep inviting entries.
   */
  async closeElapsedEntryWindows(now: Date): Promise<number> {
    const [res] = await this.db
      .update(boffMediaTournaments)
      .set({ registrationOpen: false, checkInOpen: false })
      .where(
        and(
          isNull(boffMediaTournaments.deletedAt),
          isNotNull(boffMediaTournaments.startDate),
          lt(boffMediaTournaments.startDate, now),
          sql`(${boffMediaTournaments.registrationOpen} = TRUE OR ${boffMediaTournaments.checkInOpen} = TRUE)`,
        ),
      );
    return res.affectedRows;
  }

  /**
   * Close a randomizer config whose event is no longer active.
   *
   * Minting already refuses on a non-active event (the pack-link lookup is
   * active-only by default), so this is not the security boundary — it is the
   * admin surface telling the truth. A config left reading `open` on a finished
   * event is a gate that looks armed and is not.
   */
  async closeConfigsOfInactiveEvents(): Promise<number> {
    const [res] = await this.db
      .update(randomizerConfigs)
      .set({ status: 'closed' })
      .where(
        and(
          eq(randomizerConfigs.status, 'open'),
          sql`${randomizerConfigs.eventId} IN (
            SELECT id FROM ${boffMediaEvents}
            WHERE status <> ${EVENT_STATUS.ACTIVE} OR deleted_at IS NOT NULL
          )`,
        ),
      );
    return res.affectedRows;
  }

  /**
   * Tournaments whose entry deadline has passed while the field is still open.
   * `teamsheet_locked_at IS NULL` is the "not yet resolved" marker, so a second
   * tick cannot re-resolve (and re-drop) a field that was already frozen.
   */
  async findTournamentsDueToResolve(now: Date): Promise<{ id: number }[]> {
    return this.db
      .select({ id: boffMediaTournaments.id })
      .from(boffMediaTournaments)
      .where(
        and(
          isNull(boffMediaTournaments.deletedAt),
          isNull(boffMediaTournaments.teamsheetLockedAt),
          isNotNull(boffMediaTournaments.entryDeadline),
          lte(boffMediaTournaments.entryDeadline, now),
          inArray(boffMediaTournaments.status, ['draft', 'registration']),
        ),
      );
  }

  /** Expired, fully-used or revoked invites, kept only while they can matter. */
  async deleteDeadInvites(cutoff: Date): Promise<number> {
    const [res] = await this.db
      .delete(boffMediaEventInvites)
      .where(
        and(
          isNotNull(boffMediaEventInvites.expiresAt),
          lt(boffMediaEventInvites.expiresAt, cutoff),
        ),
      );
    return res.affectedRows;
  }
}
