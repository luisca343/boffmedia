import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcRegulations, VgcRegulation } from '@/_db/schema/Vgc';

@Injectable()
export class VgcRegulationsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<VgcRegulation[]> {
    return this.db.select().from(vgcRegulations);
  }

  async findActive(): Promise<VgcRegulation[]> {
    return this.db
      .select()
      .from(vgcRegulations)
      .where(eq(vgcRegulations.active, 1));
  }

  async findById(id: string): Promise<VgcRegulation | null> {
    const [row] = await this.db
      .select()
      .from(vgcRegulations)
      .where(eq(vgcRegulations.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByFormatId(formatId: string): Promise<VgcRegulation | null> {
    const [row] = await this.db
      .select()
      .from(vgcRegulations)
      .where(eq(vgcRegulations.formatId, formatId))
      .limit(1);
    return row ?? null;
  }

  async upsert(data: {
    id: string;
    formatId: string;
    name: string;
    gameType?: string;
    vgcPastesGid?: string | null;
    active?: number;
  }): Promise<void> {
    const now = new Date();
    await this.db
      .insert(vgcRegulations)
      .values({
        id: data.id,
        formatId: data.formatId,
        name: data.name,
        gameType: data.gameType ?? 'doubles',
        vgcPastesGid: data.vgcPastesGid ?? null,
        importStatus: 'idle',
        importError: null,
        importTeamCount: 0,
        importStartedAt: null,
        importCompletedAt: null,
        active: data.active ?? 1,
        createdAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          formatId: data.formatId,
          name: data.name,
          gameType: data.gameType ?? 'doubles',
          active: data.active ?? 1,
          // Only overwrite vgcPastesGid when a string is explicitly supplied.
          // null/undefined means "leave the stored GID as-is" so that re-saving
          // the regulation form without filling in the GID field doesn't wipe
          // a previously-set value and silently break the VGCPastes routing.
          ...(typeof data.vgcPastesGid === 'string' && {
            vgcPastesGid: data.vgcPastesGid,
          }),
        },
      });
  }

  async updateImportState(
    id: string,
    patch: {
      importStatus?: string;
      importError?: string | null;
      importTeamCount?: number;
      importFetchedCount?: number;
      importStartedAt?: Date | null;
      importCompletedAt?: Date | null;
    },
  ): Promise<void> {
    const set: Partial<typeof vgcRegulations.$inferInsert> = {};
    if (patch.importStatus !== undefined) set.importStatus = patch.importStatus;
    if (patch.importError !== undefined) set.importError = patch.importError;
    if (patch.importTeamCount !== undefined)
      set.importTeamCount = patch.importTeamCount;
    if (patch.importFetchedCount !== undefined)
      set.importFetchedCount = patch.importFetchedCount;
    if (patch.importStartedAt !== undefined)
      set.importStartedAt = patch.importStartedAt;
    if (patch.importCompletedAt !== undefined)
      set.importCompletedAt = patch.importCompletedAt;
    if (Object.keys(set).length === 0) return;

    await this.db
      .update(vgcRegulations)
      .set(set)
      .where(eq(vgcRegulations.id, id));
  }
}
