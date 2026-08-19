import {
  HttpException,
  Injectable,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, ne, or, sql, isNull, inArray } from 'drizzle-orm';
import { packs, packVersions } from '@/_db/schema/Packs';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  randomizerConfigs,
  randomizerAssignments,
  randomizerAudit,
  randomizerPresets,
  randomizerRoms,
  RandomizerConfig,
  NewRandomizerConfig,
  RandomizerAssignment,
  NewRandomizerAssignment,
  RandomizerAuditRow,
  RandomizerPreset,
  NewRandomizerPreset,
  RandomizerRom,
  NewRandomizerRom,
  RandomizerAuditAction,
} from '@/_db/schema/Randomizer';
import { boffMediaUsers } from '@/_db/schema/BoffMedia';
import {
  boffMediaParticipants,
  boffMediaEventParticipants,
  boffMediaEvents,
} from '@/_db/schema/BoffMediaEvents';
import { Logger } from 'nestjs-pino';

/**
 * Drizzle wraps driver errors in a query error and hangs the real mysql2 error
 * off `.cause` (the transaction path nests it further), so a top-level
 * `error.code` check misses ER_DUP_ENTRY. Walk the cause chain instead.
 */
function isDuplicateEntry(error: unknown): boolean {
  let e: any = error;
  while (e) {
    if (e.code === 'ER_DUP_ENTRY') return true;
    e = e.cause;
  }
  return false;
}

@Injectable()
export class RandomizerRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== CONFIGS ====================

  /**
   * Insert a config AND attach its pack to the event in one transaction, so a
   * config can never exist without its event being resolvable-by-pack.
   */
  async createConfigAndAttachPack(
    data: NewRandomizerConfig,
    packId: string,
  ): Promise<number> {
    try {
      return await this.db.transaction(async (tx) => {
        const result = await tx
          .insert(randomizerConfigs)
          .values(data)
          .execute();
        await tx
          .update(boffMediaEvents)
          .set({ packId })
          .where(eq(boffMediaEvents.id, data.eventId))
          .execute();
        return result[0].insertId;
      });
    } catch (error: any) {
      this.logger.error('Failed to create randomizer config:', error);
      if (isDuplicateEntry(error)) {
        throw new ConflictException({
          message: `A randomizer config already exists for event ${data.eventId}`,
          userMessage:
            'Ya existe una configuración para este evento. Edítala o elimínala antes de crear otra.',
        });
      }
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Config creation failed: ${error.message}`);
    }
  }

  /** Return the pack iff it exists and is an emulator pack; else null. */
  async getEmulatorPack(
    packId: string,
  ): Promise<{ id: string; name: string } | null> {
    if (!packId) return null;
    const rows = await this.db
      .select({ id: packs.id, name: packs.name })
      .from(packs)
      .where(and(eq(packs.id, packId), eq(packs.gameType, 'emulator')))
      .execute();
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * The emulator ROM a pack's published version actually ships: the files[]
   * entry whose path equals version.emulator.rom. This is the hash the
   * launcher's clean-ROM gate compares against, so configs must pin the same
   * value or the anti-cheat silently disarms.
   *
   * null = pack not found; 'no-version' = nothing published yet;
   * 'no-rom' = published version declares no resolvable emulator ROM entry.
   */
  async getPublishedEmulatorRom(
    packId: string,
  ): Promise<
    | { state: 'no-version' }
    | { state: 'no-rom' }
    | { state: 'ok'; versionId: string; romPath: string; sha512: string }
    | null
  > {
    if (!packId) return null;
    const packRows = await this.db
      .select({ latestVersionId: packs.latestVersionId })
      .from(packs)
      .where(eq(packs.id, packId))
      .execute();
    if (packRows.length === 0) return null;
    const latestVersionId = packRows[0].latestVersionId;
    if (!latestVersionId) return { state: 'no-version' };

    const versionRows = await this.db
      .select({
        id: packVersions.id,
        files: packVersions.files,
        emulator: packVersions.emulator,
        published: packVersions.published,
      })
      .from(packVersions)
      .where(eq(packVersions.id, latestVersionId))
      .execute();
    const version = versionRows[0];
    if (!version || !version.published) return { state: 'no-version' };

    // MariaDB implements JSON as a LONGTEXT alias, so mysql2 hands these back as
    // raw strings whatever `json()` types them as — `$type<>` is compile-time
    // only. PacksRepository has `hydrate()` for exactly this; reading the table
    // directly from here bypassed it, so `emulator.rom` was always undefined and
    // `files` was never an array. The guard therefore reported 'no-rom' for
    // EVERY pack, including perfectly valid ones, and no randomizer config could
    // be opened.
    const emulator = parseJsonColumn<{ rom?: unknown }>(version.emulator);
    const romPath = emulator?.rom;
    if (typeof romPath !== 'string' || !romPath) return { state: 'no-rom' };

    const parsedFiles = parseJsonColumn<
      Array<{ path?: unknown; sha512?: unknown }>
    >(version.files);
    const files = Array.isArray(parsedFiles) ? parsedFiles : [];
    const entry = files.find((f) => f?.path === romPath);
    if (!entry || typeof entry.sha512 !== 'string') return { state: 'no-rom' };

    return {
      state: 'ok',
      versionId: version.id,
      romPath,
      sha512: entry.sha512,
    };
  }

  /**
   * The launcher resolves a pack to at most one event (the link lookup takes
   * the first row), so a pack must map to a single event. Return the id of any
   * OTHER event already holding this pack, or null.
   */
  async findEventHoldingPack(
    packId: string,
    exceptEventId: number,
  ): Promise<number | null> {
    if (!packId) return null;
    const rows = await this.db
      .select({ id: boffMediaEvents.id })
      .from(boffMediaEvents)
      .where(
        and(
          eq(boffMediaEvents.packId, packId),
          ne(boffMediaEvents.id, exceptEventId),
        ),
      )
      .execute();
    return rows.length > 0 ? rows[0].id : null;
  }

  /** Attach (or re-attach) a pack to an event. */
  async attachPackToEvent(eventId: number, packId: string): Promise<void> {
    await this.db
      .update(boffMediaEvents)
      .set({ packId })
      .where(eq(boffMediaEvents.id, eventId))
      .execute();
  }

  /** Read an event's pack + status (for launcher-resolvability enrichment). */
  async getEventPackAndStatus(
    eventId: number,
  ): Promise<{ packId: string | null; status: string } | null> {
    const rows = await this.db
      .select({
        packId: boffMediaEvents.packId,
        status: boffMediaEvents.status,
      })
      .from(boffMediaEvents)
      .where(eq(boffMediaEvents.id, eventId))
      .execute();
    return rows.length > 0 ? rows[0] : null;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      this.logger.error(`Failed to get config for event ${eventId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Config retrieval failed: ${error.message}`);
    }
  }

  async listConfigs(): Promise<RandomizerConfig[]> {
    try {
      return await this.db.select().from(randomizerConfigs).execute();
    } catch (error: any) {
      this.logger.error('Failed to list configs:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Configs listing failed: ${error.message}`);
    }
  }

  /** All configs with their event's pack + status, for resolvability enrichment. */
  async listConfigsWithEventMeta(): Promise<
    Array<{
      config: RandomizerConfig;
      packId: string | null;
      eventStatus: string;
    }>
  > {
    try {
      return await this.db
        .select({
          config: randomizerConfigs,
          packId: boffMediaEvents.packId,
          eventStatus: boffMediaEvents.status,
        })
        .from(randomizerConfigs)
        .innerJoin(
          boffMediaEvents,
          eq(boffMediaEvents.id, randomizerConfigs.eventId),
        )
        .execute();
    } catch (error: any) {
      this.logger.error('Failed to list configs with event meta:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Configs listing failed: ${error.message}`);
    }
  }

  async countAssignmentsByConfig(configId: number): Promise<number> {
    const rows = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(randomizerAssignments)
      .where(eq(randomizerAssignments.configId, configId))
      .execute();
    return Number(rows[0]?.n ?? 0);
  }

  /**
   * Delete a config AND free its event's pack in one transaction — the
   * symmetric undo of createConfigAndAttachPack, so the pack becomes
   * attachable to another event.
   */
  async deleteConfigAndDetachPack(
    configId: number,
    eventId: number,
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .delete(randomizerConfigs)
          .where(eq(randomizerConfigs.id, configId))
          .execute();
        await tx
          .update(boffMediaEvents)
          .set({ packId: null })
          .where(eq(boffMediaEvents.id, eventId))
          .execute();
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete config ${configId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Config deletion failed: ${error.message}`);
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Assignment creation failed: ${error.message}`);
    }
  }

  async getAssignmentByConfigAndUser(
    configId: number,
    userId: number,
  ): Promise<RandomizerAssignment | null> {
    if (!configId || !userId) {
      return null;
    }

    try {
      const rows = await this.db
        .select()
        .from(randomizerAssignments)
        .where(
          and(
            eq(randomizerAssignments.configId, configId),
            eq(randomizerAssignments.boffmediaUserId, userId),
          ),
        )
        .execute();

      return rows.length > 0 ? rows[0] : null;
    } catch (error: any) {
      this.logger.error(
        `Failed to get assignment for config ${configId}, user ${userId}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Assignment update failed: ${error.message}`);
    }
  }

  // ==================== ENTITLEMENT RESOLUTION ====================

  /**
   * Returns { boffmediaUserId, status } if registered/confirmed, else null.
   *
   * Direct join on the account. This used to walk MC UUID → boffmedia_users →
   * participants, which meant a player who joined an event but never linked
   * Minecraft could not claim a seed for an emulator event.
   */
  async resolveEventEntitlement(
    eventId: number,
    userId: number,
  ): Promise<{ boffmediaUserId: number; status: string } | null> {
    if (!eventId || eventId <= 0 || !userId) {
      return null;
    }

    try {
      const rows = await this.db
        .select({
          boffmediaUserId: boffMediaParticipants.userId,
          status: boffMediaEventParticipants.status,
        })
        .from(boffMediaParticipants)
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
        .innerJoin(
          boffMediaEvents,
          and(
            eq(boffMediaEvents.id, boffMediaEventParticipants.eventId),
            isNull(boffMediaEvents.deletedAt),
          ),
        )
        .where(
          and(
            eq(boffMediaParticipants.userId, userId),
            inArray(boffMediaEventParticipants.status, [
              'registered',
              'confirmed',
            ]),
          ),
        )
        .execute();

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        boffmediaUserId: row.boffmediaUserId!,
        status: row.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to resolve entitlement for event ${eventId}, user ${userId}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Audit append failed: ${error.message}`);
    }
  }

  /**
   * List all assignments for a config with user display names (public view).
   * Joins to get the user display name from boffMediaUsers via boffMediaParticipants.
   */
  async listAssignmentsByConfigWithDisplayNames(
    configId: number,
  ): Promise<(RandomizerAssignment & { displayName: string })[]> {
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Preset retrieval failed: ${error.message}`);
    }
  }

  async listPresets(): Promise<RandomizerPreset[]> {
    try {
      return await this.db.select().from(randomizerPresets).execute();
    } catch (error: any) {
      this.logger.error('Failed to list presets:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
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
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Preset deletion failed: ${error.message}`);
    }
  }

  // ==================== ROM LIBRARY ====================

  /**
   * Insert a library ROM row. sha512 is UNIQUE (content address), so a duplicate
   * upload surfaces as a 409 the admin UI can explain, not an opaque 500.
   */
  async createRom(data: NewRandomizerRom): Promise<number> {
    try {
      const result = await this.db
        .insert(randomizerRoms)
        .values(data)
        .execute();
      return result[0].insertId;
    } catch (error: any) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException({
          message: `A ROM with sha512 ${data.sha512} already exists in the library`,
          userMessage:
            'Esta ROM ya está en la biblioteca (mismo contenido). Usa la existente.',
        });
      }
      this.logger.error('Failed to create randomizer ROM:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`ROM creation failed: ${error.message}`);
    }
  }

  async getRomById(id: number): Promise<RandomizerRom | null> {
    if (!id || id <= 0) return null;
    const rows = await this.db
      .select()
      .from(randomizerRoms)
      .where(eq(randomizerRoms.id, id))
      .execute();
    return rows.length > 0 ? rows[0] : null;
  }

  async getRomBySha512(sha512: string): Promise<RandomizerRom | null> {
    if (!sha512) return null;
    const rows = await this.db
      .select()
      .from(randomizerRoms)
      .where(eq(randomizerRoms.sha512, sha512))
      .execute();
    return rows.length > 0 ? rows[0] : null;
  }

  /** List all library ROMs, each with the number of configs that reference it. */
  async listRomsWithRefCount(): Promise<
    (RandomizerRom & { referencedBy: number })[]
  > {
    const roms = await this.db.select().from(randomizerRoms).execute();
    if (roms.length === 0) return [];
    return Promise.all(
      roms.map(async (rom) => ({
        ...rom,
        referencedBy: await this.countConfigsReferencingRom(rom.id, rom.sha512),
      })),
    );
  }

  /**
   * How many configs reference a library ROM — by provenance FK (rom_id) OR by
   * the pinned clean hash (clean_rom_sha512). Either link blocks deletion, so a
   * live event never loses its base ROM out from under it.
   */
  async countConfigsReferencingRom(
    romId: number,
    sha512: string,
  ): Promise<number> {
    const rows = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(randomizerConfigs)
      .where(
        or(
          eq(randomizerConfigs.romId, romId),
          eq(randomizerConfigs.cleanRomSha512, sha512),
        ),
      )
      .execute();
    return Number(rows[0]?.n ?? 0);
  }

  async deleteRom(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Valid ROM ID is required');
    }
    await this.db
      .delete(randomizerRoms)
      .where(eq(randomizerRoms.id, id))
      .execute();
  }
}

/**
 * Read a MariaDB "JSON" column that mysql2 may hand back as a raw string.
 *
 * Tolerant of both shapes because the same column reads as an object on MySQL
 * and as a string on MariaDB, and of malformed text because a manifest that
 * cannot be parsed must fail the caller's own validity check ('no-rom'), not
 * throw out of a read.
 */
function parseJsonColumn<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
