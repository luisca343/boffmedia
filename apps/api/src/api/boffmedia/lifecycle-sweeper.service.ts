import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { LifecycleSweeperRepository } from './lifecycle-sweeper.repository';
import { EventsService } from './events/services/events.service';
import { EntryService } from './tournaments/services/entry.service';

/** How long a dead invite is kept before it is deleted, for support questions. */
const INVITE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The clock the events/tournaments lifecycle never had.
 *
 * Both domains store dates and then rely entirely on an admin clicking at the
 * right moment: an event stays `upcoming` past its start date, and a tournament
 * keeps advertising an open registration window after it began.
 *
 * Deliberately one-directional on events. Activation is safe to automate — the
 * worst case is an event opening on time. Completion is not: it stops progress
 * writes and seed minting, and reopening is refused while a non-draft randomizer
 * config is attached, so a loosely-set end date could close an event that cannot
 * easily be reopened. Closing an event stays a decision someone makes.
 *
 * Housekeeping semantics: every read path already enforces these rules itself
 * (registration re-checks its own deadline, minting re-checks the event), so
 * nothing depends on this having run — it makes the stored state agree with the
 * clock rather than being the thing that enforces it.
 */
@Injectable()
export class LifecycleSweeperService {
  constructor(
    private readonly logger: Logger,
    private readonly repo: LifecycleSweeperRepository,
    private readonly events: EventsService,
    private readonly entry: EntryService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    const now = new Date();
    try {
      await this.activateDueEvents(now);
      await this.closeElapsedWindows(now);
      await this.resolveDueEntryFields(now);
      await this.closeOrphanedConfigs();
      await this.purgeDeadInvites(now);
    } catch (error: any) {
      // A failed tick must never crash the scheduler; the next one retries.
      this.logger.error(`Lifecycle sweep failed: ${error?.message}`);
    }
  }

  private async activateDueEvents(now: Date): Promise<void> {
    const due = await this.repo.findEventsDueToActivate(now);
    for (const { id } of due) {
      try {
        // Through the service, not a bulk UPDATE: it owns the transition rules
        // and writes the audit row, and `actorUserId: null` is what marks the
        // change as the scheduler's rather than a person's.
        await this.events.setStatus(id, 'active', { actorUserId: null });
        this.logger.log(`Event ${id} activated on schedule`);
      } catch (error: any) {
        this.logger.error(
          `Event ${id} auto-activation failed: ${error?.message}`,
        );
      }
    }
  }

  private async closeElapsedWindows(now: Date): Promise<void> {
    const closed = await this.repo.closeElapsedEntryWindows(now);
    if (closed > 0) {
      this.logger.log(
        `Closed entry windows on ${closed} elapsed tournament(s)`,
      );
    }
  }

  /**
   * Freeze the field on tournaments whose entry deadline has passed. Same
   * operation generate runs, so a tournament resolved here is simply ready:
   * the admin generates from an already-settled field instead of discovering
   * at generate time that half the roster never checked in.
   */
  private async resolveDueEntryFields(now: Date): Promise<void> {
    const due = await this.repo.findTournamentsDueToResolve(now);
    for (const { id } of due) {
      try {
        const { entered, dropped } = await this.entry.resolve(id);
        this.logger.log(
          `Tournament ${id} entry resolved: ${entered.length} entered, ${dropped.length} dropped`,
        );
      } catch (error: any) {
        this.logger.error(
          `Tournament ${id} entry resolution failed: ${error?.message}`,
        );
      }
    }
  }

  private async closeOrphanedConfigs(): Promise<void> {
    const closed = await this.repo.closeConfigsOfInactiveEvents();
    if (closed > 0) {
      this.logger.log(
        `Closed ${closed} randomizer config(s) whose event is no longer active`,
      );
    }
  }

  private async purgeDeadInvites(now: Date): Promise<void> {
    const deleted = await this.repo.deleteDeadInvites(
      new Date(now.getTime() - INVITE_GRACE_MS),
    );
    if (deleted > 0) this.logger.log(`Purged ${deleted} expired invite(s)`);
  }
}
