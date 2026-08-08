import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNotNull, inArray, or } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  randomizerEvents,
  randomizerAssignments,
  randomizerAudit,
  randomizerPresets,
  RandomizerEvent,
  NewRandomizerEvent,
  RandomizerAssignment,
  NewRandomizerAssignment,
  RandomizerAuditRow,
  RandomizerPreset,
  NewRandomizerPreset,
  RandomizerAuditAction,
} from '@/_db/schema/Randomizer';
import {
  boffMediaTournamentParticipants,
  TournamentParticipant,
} from '@/_db/schema/BoffMediaTournaments';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import { Logger } from 'nestjs-pino';

@Injectable()
export class RandomizerRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== EVENTS ====================

  async createEvent(data: NewRandomizerEvent): Promise<number> {
    try {
      const result = await this.db
        .insert(randomizerEvents)
        .values(data)
        .execute();

      return result[0].insertId;
    } catch (error: any) {
      this.logger.error('Failed to create randomizer event:', error);
      throw new Error(`Event creation failed: ${error.message}`);
    }
  }

  async getEventById(id: number): Promise<RandomizerEvent | null> {
    if (!id || id <= 0) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerEvents)
        .where(eq(randomizerEvents.id, id))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to get event by ID ${id}:`, error);
      throw new Error(`Event retrieval failed: ${error.message}`);
    }
  }

  async findActiveEventByPackId(packId: string): Promise<RandomizerEvent | null> {
    if (!packId) {
      return null;
    }

    try {
      // Find events with this packId that are in an active state (locked or running).
      // Players can only claim assignments once seeds exist (locked or running).
      // Draft events have no seeds; finished events are closed to new claims.
      const rows = await this.db
        .select()
        .from(randomizerEvents)
        .where(
          and(
            eq(randomizerEvents.packId, packId),
            or(
              eq(randomizerEvents.status, 'locked'),
              eq(randomizerEvents.status, 'running'),
            ),
          ),
        )
        .execute();

      if (rows.length === 0) {
        return null;
      }

      // If multiple active events for the same pack, prefer locked over running,
      // then return the first one (should not occur in normal operation).
      const lockedEvent = rows.find((e) => e.status === 'locked');
      if (lockedEvent) {
        return lockedEvent;
      }

      return rows[0];
    } catch (error: any) {
      this.logger.error(
        `Failed to find active event for pack ${packId}:`,
        error,
      );
      throw new Error(`Active event lookup failed: ${error.message}`);
    }
  }

  async listEventsByTournament(
    tournamentId: number,
  ): Promise<RandomizerEvent[]> {
    if (!tournamentId || tournamentId <= 0) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(randomizerEvents)
        .where(eq(randomizerEvents.tournamentId, tournamentId))
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to list events for tournament ${tournamentId}:`,
        error,
      );
      throw new Error(`Events listing failed: ${error.message}`);
    }
  }

  async updateEvent(
    id: number,
    patch: Partial<NewRandomizerEvent>,
  ): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid event ID is required');
    }

    try {
      await this.db
        .update(randomizerEvents)
        .set(patch)
        .where(eq(randomizerEvents.id, id))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to update event ${id}:`, error);
      throw new Error(`Event update failed: ${error.message}`);
    }
  }

  // ==================== ASSIGNMENTS ====================

  async createAssignments(rows: NewRandomizerAssignment[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    try {
      await this.db.insert(randomizerAssignments).values(rows).execute();
    } catch (error: any) {
      this.logger.error('Failed to create randomizer assignments:', error);
      throw new Error(`Assignments creation failed: ${error.message}`);
    }
  }

  async getAssignment(
    eventId: number,
    participantId: number,
  ): Promise<RandomizerAssignment | null> {
    if (!eventId || !participantId) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerAssignments)
        .where(
          and(
            eq(randomizerAssignments.eventId, eventId),
            eq(randomizerAssignments.participantId, participantId),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get assignment for event ${eventId}, participant ${participantId}:`,
        error,
      );
      throw new Error(`Assignment retrieval failed: ${error.message}`);
    }
  }

  async getAssignmentByMcUuid(
    eventId: number,
    mcUuid: string,
  ): Promise<RandomizerAssignment | null> {
    if (!eventId || !mcUuid) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerAssignments)
        .where(
          and(
            eq(randomizerAssignments.eventId, eventId),
            eq(randomizerAssignments.mcUuid, mcUuid),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get assignment for event ${eventId}, MC UUID ${mcUuid}:`,
        error,
      );
      throw new Error(`Assignment retrieval failed: ${error.message}`);
    }
  }

  async getAssignmentById(
    assignmentId: number,
  ): Promise<RandomizerAssignment | null> {
    if (!assignmentId || assignmentId <= 0) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerAssignments)
        .where(eq(randomizerAssignments.id, assignmentId))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get assignment by ID ${assignmentId}:`,
        error,
      );
      throw new Error(`Assignment retrieval failed: ${error.message}`);
    }
  }

  async listAssignmentsByEvent(
    eventId: number,
  ): Promise<RandomizerAssignment[]> {
    if (!eventId || eventId <= 0) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(randomizerAssignments)
        .where(eq(randomizerAssignments.eventId, eventId))
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to list assignments for event ${eventId}:`,
        error,
      );
      throw new Error(`Assignments listing failed: ${error.message}`);
    }
  }

  async updateAssignment(
    id: number,
    patch: Partial<NewRandomizerAssignment>,
  ): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid assignment ID is required');
    }

    try {
      await this.db
        .update(randomizerAssignments)
        .set(patch)
        .where(eq(randomizerAssignments.id, id))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to update assignment ${id}:`, error);
      throw new Error(`Assignment update failed: ${error.message}`);
    }
  }

  // ==================== PARTICIPANTS ====================

  async listCheckedInParticipants(
    tournamentId: number,
  ): Promise<TournamentParticipant[]> {
    if (!tournamentId || tournamentId <= 0) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(boffMediaTournamentParticipants)
        .where(
          and(
            eq(boffMediaTournamentParticipants.tournamentId, tournamentId),
            isNotNull(boffMediaTournamentParticipants.checkedInAt),
          ),
        )
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to list checked-in participants for tournament ${tournamentId}:`,
        error,
      );
      throw new Error(`Participants listing failed: ${error.message}`);
    }
  }

  /**
   * Resolve a participant ID via the identity chain:
   * mcUuid → boffMediaUsers (uuid = mcUuid)
   *       → boffMediaTournamentParticipants (userId = users.id AND tournamentId)
   *       → participant.id
   *
   * Returns the participant ID if found, or null if the user is not linked
   * or is not a participant in the tournament.
   */
  async resolveParticipantId(
    tournamentId: number,
    mcUuid: string,
  ): Promise<number | null> {
    if (!tournamentId || tournamentId <= 0 || !mcUuid) {
      return null;
    }

    try {
      const rows = await this.db
        .select({ participantId: boffMediaTournamentParticipants.id })
        .from(boffMediaUsers)
        .innerJoin(
          boffMediaTournamentParticipants,
          and(
            eq(boffMediaTournamentParticipants.userId, boffMediaUsers.id),
            eq(boffMediaTournamentParticipants.tournamentId, tournamentId),
          ),
        )
        .where(eq(boffMediaUsers.uuid, mcUuid))
        .execute();

      return rows.length > 0 ? rows[0].participantId : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve participant ID for tournament ${tournamentId}, MC UUID ${mcUuid}:`,
        error,
      );
      throw new Error(`Participant ID resolution failed: ${error.message}`);
    }
  }

  // ==================== AUDIT ====================

  async appendAudit(row: {
    eventId?: number | null;
    assignmentId?: number | null;
    action: RandomizerAuditAction;
    actor?: string | null;
    meta?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.db
        .insert(randomizerAudit)
        .values({
          eventId: row.eventId || null,
          assignmentId: row.assignmentId || null,
          action: row.action,
          actor: row.actor || null,
          meta: row.meta || null,
        } as RandomizerAuditRow)
        .execute();
    } catch (error: any) {
      this.logger.error('Failed to append audit record:', error);
      throw new Error(`Audit append failed: ${error.message}`);
    }
  }

  /**
   * List all assignments for an event with participant display names (public view).
   * Joins to get the participant name from the tournament participants table.
   * Includes participant name in the result.
   */
  async listAssignmentsByEventWithParticipantNames(
    eventId: number,
  ): Promise<
    (RandomizerAssignment & { participantName: string })[]
  > {
    if (!eventId || eventId <= 0) {
      return [];
    }

    try {
      const rows = await this.db
        .select({
          a: randomizerAssignments,
          participantName: boffMediaTournamentParticipants.name,
        })
        .from(randomizerAssignments)
        .innerJoin(
          boffMediaTournamentParticipants,
          eq(
            boffMediaTournamentParticipants.id,
            randomizerAssignments.participantId,
          ),
        )
        .where(eq(randomizerAssignments.eventId, eventId))
        .execute();

      return rows.map((row) => ({
        ...row.a,
        participantName: row.participantName,
      }));
    } catch (error: any) {
      this.logger.error(
        `Failed to list assignments with names for event ${eventId}:`,
        error,
      );
      throw new Error(
        `Assignments listing with names failed: ${error.message}`,
      );
    }
  }

  // ==================== PRESETS ====================

  async createPreset(data: NewRandomizerPreset): Promise<number> {
    try {
      const result = await this.db
        .insert(randomizerPresets)
        .values(data)
        .execute();

      return result[0].insertId;
    } catch (error: any) {
      this.logger.error('Failed to create randomizer preset:', error);
      throw new Error(`Preset creation failed: ${error.message}`);
    }
  }

  async getPresetById(id: number): Promise<RandomizerPreset | null> {
    if (!id || id <= 0) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerPresets)
        .where(eq(randomizerPresets.id, id))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to get preset by ID ${id}:`, error);
      throw new Error(`Preset retrieval failed: ${error.message}`);
    }
  }

  async listPresets(): Promise<RandomizerPreset[]> {
    try {
      return await this.db.select().from(randomizerPresets).execute();
    } catch (error: any) {
      this.logger.error('Failed to list presets:', error);
      throw new Error(`Presets listing failed: ${error.message}`);
    }
  }

  async updatePreset(
    id: number,
    patch: Partial<NewRandomizerPreset>,
  ): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid preset ID is required');
    }

    try {
      await this.db
        .update(randomizerPresets)
        .set(patch)
        .where(eq(randomizerPresets.id, id))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to update preset ${id}:`, error);
      throw new Error(`Preset update failed: ${error.message}`);
    }
  }

  async deletePreset(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid preset ID is required');
    }

    try {
      await this.db
        .delete(randomizerPresets)
        .where(eq(randomizerPresets.id, id))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to delete preset ${id}:`, error);
      throw new Error(`Preset deletion failed: ${error.message}`);
    }
  }
}
