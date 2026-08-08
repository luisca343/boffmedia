import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNotNull, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  randomizerConfigs,
  randomizerAssignments,
  randomizerAudit,
  randomizerPresets,
  RandomizerConfig,
  NewRandomizerConfig,
  RandomizerAssignment,
  NewRandomizerAssignment,
  RandomizerAuditRow,
  RandomizerPreset,
  NewRandomizerPreset,
  RandomizerAuditAction,
} from '@/_db/schema/Randomizer';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import {
  boffMediaParticipants,
  boffMediaEventParticipants,
  boffMediaEvents,
  EVENT_STATUS,
} from '@/_db/schema/BoffMediaEvents';
import { Logger } from 'nestjs-pino';

@Injectable()
export class RandomizerRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== CONFIGS ====================

  async createConfig(data: NewRandomizerConfig): Promise<number> {
    try {
      const result = await this.db
        .insert(randomizerConfigs)
        .values(data)
        .execute();

      return result[0].insertId;
    } catch (error: any) {
      this.logger.error('Failed to create randomizer config:', error);
      throw new Error(`Config creation failed: ${error.message}`);
    }
  }

  async getConfigById(id: number): Promise<RandomizerConfig | null> {
    if (!id || id <= 0) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerConfigs)
        .where(eq(randomizerConfigs.id, id))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to get config by ID ${id}:`, error);
      throw new Error(`Config retrieval failed: ${error.message}`);
    }
  }

  /**
   * Resolve a pack to its randomizer config: the config of the ACTIVE
   * community event that has this pack attached. Returns null if no such
   * event/config (→ launcher renders no panel). Config-status gating
   * (open/closed/published) is left to the caller (getMyAssignment).
   */
  async getConfigByPackId(packId: string): Promise<RandomizerConfig | null> {
    if (!packId) {
      return null;
    }

    try {
      const rows = await this.db
        .select({ config: randomizerConfigs })
        .from(boffMediaEvents)
        .innerJoin(
          randomizerConfigs,
          eq(randomizerConfigs.eventId, boffMediaEvents.id),
        )
        .where(
          and(
            eq(boffMediaEvents.packId, packId),
            eq(boffMediaEvents.status, EVENT_STATUS.ACTIVE),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0].config : null;
    } catch (error: any) {
      this.logger.error(`Failed to get config by pack ${packId}:`, error);
      throw new Error(`Config retrieval failed: ${error.message}`);
    }
  }

  async getConfigByEventId(eventId: number): Promise<RandomizerConfig | null> {
    if (!eventId || eventId <= 0) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerConfigs)
        .where(eq(randomizerConfigs.eventId, eventId))
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get config for event ${eventId}:`,
        error,
      );
      throw new Error(`Config retrieval failed: ${error.message}`);
    }
  }

  async listConfigs(): Promise<RandomizerConfig[]> {
    try {
      return await this.db.select().from(randomizerConfigs).execute();
    } catch (error: any) {
      this.logger.error('Failed to list configs:', error);
      throw new Error(`Configs listing failed: ${error.message}`);
    }
  }

  async updateConfig(
    id: number,
    patch: Partial<NewRandomizerConfig>,
  ): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid config ID is required');
    }

    try {
      await this.db
        .update(randomizerConfigs)
        .set(patch)
        .where(eq(randomizerConfigs.id, id))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to update config ${id}:`, error);
      throw new Error(`Config update failed: ${error.message}`);
    }
  }

  // ==================== ASSIGNMENTS ====================

  async createAssignment(data: NewRandomizerAssignment): Promise<number> {
    try {
      const result = await this.db
        .insert(randomizerAssignments)
        .values(data)
        .execute();

      return result[0].insertId;
    } catch (error: any) {
      this.logger.error('Failed to create randomizer assignment:', error);
      throw new Error(`Assignment creation failed: ${error.message}`);
    }
  }

  async getAssignmentByConfigAndMcUuid(
    configId: number,
    mcUuid: string,
  ): Promise<RandomizerAssignment | null> {
    if (!configId || !mcUuid) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerAssignments)
        .where(
          and(
            eq(randomizerAssignments.configId, configId),
            eq(randomizerAssignments.mcUuid, mcUuid),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get assignment for config ${configId}, MC UUID ${mcUuid}:`,
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

  async listAssignmentsByConfig(
    configId: number,
  ): Promise<RandomizerAssignment[]> {
    if (!configId || configId <= 0) {
      return [];
    }

    try {
      return await this.db
        .select()
        .from(randomizerAssignments)
        .where(eq(randomizerAssignments.configId, configId))
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to list assignments for config ${configId}:`,
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

  // ==================== ENTITLEMENT RESOLUTION ====================

  /**
   * Resolve boffmedia user ID and event participant status via the identity chain:
   * mcUuid → boffMediaUsers (uuid = mcUuid)
   *       → boffMediaParticipants (userId)
   *       → boffMediaEventParticipants (participantId, eventId)
   *
   * Returns { boffmediaUserId, status } if registered/confirmed, or null if not eligible.
   */
  async resolveEventEntitlement(
    eventId: number,
    mcUuid: string,
  ): Promise<{ boffmediaUserId: number; status: string } | null> {
    if (!eventId || eventId <= 0 || !mcUuid) {
      return null;
    }

    try {
      const rows = await this.db
        .select({
          boffmediaUserId: boffMediaUsers.id,
          status: boffMediaEventParticipants.status,
        })
        .from(boffMediaUsers)
        .innerJoin(
          boffMediaParticipants,
          eq(boffMediaParticipants.userId, boffMediaUsers.id),
        )
        .innerJoin(
          boffMediaEventParticipants,
          and(
            eq(
              boffMediaEventParticipants.participantId,
              boffMediaParticipants.id,
            ),
            eq(boffMediaEventParticipants.eventId, eventId),
          ),
        )
        .where(eq(boffMediaUsers.uuid, mcUuid))
        .execute();

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      // Only 'registered' or 'confirmed' are eligible
      if (row.status !== 'registered' && row.status !== 'confirmed') {
        return null;
      }

      return {
        boffmediaUserId: row.boffmediaUserId,
        status: row.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve entitlement for event ${eventId}, MC UUID ${mcUuid}:`,
        error,
      );
      throw new Error(`Entitlement resolution failed: ${error.message}`);
    }
  }

  // ==================== AUDIT ====================

  async appendAudit(row: {
    configId?: number | null;
    assignmentId?: number | null;
    action: RandomizerAuditAction;
    actor?: string | null;
    meta?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.db
        .insert(randomizerAudit)
        .values({
          configId: row.configId || null,
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
   * List all assignments for a config with user display names (public view).
   * Joins to get the user display name from boffMediaUsers via boffMediaParticipants.
   */
  async listAssignmentsByConfigWithDisplayNames(
    configId: number,
  ): Promise<
    (RandomizerAssignment & { displayName: string })[]
  > {
    if (!configId || configId <= 0) {
      return [];
    }

    try {
      const rows = await this.db
        .select({
          a: randomizerAssignments,
          displayName: boffMediaUsers.username,
        })
        .from(randomizerAssignments)
        .leftJoin(
          boffMediaUsers,
          eq(boffMediaUsers.id, randomizerAssignments.boffmediaUserId),
        )
        .where(eq(randomizerAssignments.configId, configId))
        .execute();

      return rows.map((row) => ({
        ...row.a,
        displayName: row.displayName || 'Anonymous',
      }));
    } catch (error: any) {
      this.logger.error(
        `Failed to list assignments with names for config ${configId}:`,
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
