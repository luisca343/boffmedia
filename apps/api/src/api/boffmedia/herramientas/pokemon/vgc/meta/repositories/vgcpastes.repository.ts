import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcPasteTeams, vgcPastes, VgcPasteTeam } from '@/_db/schema/Vgc';

@Injectable()
export class VgcPastesRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findByRegulation(regulationId: string): Promise<VgcPasteTeam[]> {
    return this.db.select().from(vgcPasteTeams).where(eq(vgcPasteTeams.regulationId, regulationId));
  }

  async upsertTeam(data: {
    id:              string;
    pasteId?:        number | null;
    pasteUrl?:       string | null;
    playerName?:     string | null;
    teamDescription?:string | null;
    tournament?:     string | null;
    dateShared?:     string | null;
    rank?:           string | null;
    regulationId?:   string | null;
    species:         string[];
    items?:          string[];
    replicaStatus?:  string | null;
    replicaCode?:    string | null;
    hasEvs?:         string | null;
    sourceUrl?:      string | null;
    owner?:          string | null;
  }): Promise<void> {
    const row = {
      id:              data.id,
      pasteId:         data.pasteId         ?? null,
      pasteUrl:        data.pasteUrl        ?? null,
      playerName:      data.playerName      ?? null,
      teamDescription: data.teamDescription ?? null,
      tournament:      data.tournament      ?? null,
      dateShared:      data.dateShared      ?? null,
      rank:            data.rank            ?? null,
      regulationId:    data.regulationId    ?? null,
      species:         JSON.stringify(data.species),
      items:           JSON.stringify(data.items ?? []),
      replicaStatus:   data.replicaStatus   ?? null,
      replicaCode:     data.replicaCode     ?? null,
      hasEvs:          data.hasEvs          ?? null,
      sourceUrl:       data.sourceUrl       ?? null,
      owner:           data.owner           ?? null,
      fetchedAt:       new Date(),
    };
    await this.db
      .insert(vgcPasteTeams)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          pasteId:         row.pasteId,
          pasteUrl:        row.pasteUrl,
          playerName:      row.playerName,
          teamDescription: row.teamDescription,
          tournament:      row.tournament,
          dateShared:      row.dateShared,
          rank:            row.rank,
          species:         row.species,
          items:           row.items,
          replicaStatus:   row.replicaStatus,
          replicaCode:     row.replicaCode,
          hasEvs:          row.hasEvs,
          sourceUrl:       row.sourceUrl,
          owner:           row.owner,
          fetchedAt:       row.fetchedAt,
        },
      });
  }

  async linkPaste(teamId: string, pasteId: number): Promise<void> {
    await this.db
      .update(vgcPasteTeams)
      .set({ pasteId })
      .where(eq(vgcPasteTeams.id, teamId));
  }

  async deleteByRegulation(regulationId: string): Promise<void> {
    await this.db.delete(vgcPasteTeams).where(eq(vgcPasteTeams.regulationId, regulationId));
  }

  async findAvailableRegulations(): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ regulationId: vgcPasteTeams.regulationId })
      .from(vgcPasteTeams)
      .where(isNotNull(vgcPasteTeams.regulationId));
    return rows.map((r) => r.regulationId).filter(Boolean) as string[];
  }

  /** Teams that have a paste URL but have not yet had their paste fetched and linked. */
  async findTeamsNeedingFetch(regulationId: string): Promise<Array<{ id: string; pasteUrl: string }>> {
    const rows = await this.db
      .select({ id: vgcPasteTeams.id, pasteUrl: vgcPasteTeams.pasteUrl })
      .from(vgcPasteTeams)
      .where(
        and(
          eq(vgcPasteTeams.regulationId, regulationId),
          isNotNull(vgcPasteTeams.pasteUrl),
          isNull(vgcPasteTeams.pasteId),
        ),
      );
    return rows.filter((r): r is { id: string; pasteUrl: string } => r.pasteUrl !== null);
  }

  /** All parsed paste slots for teams in a regulation that have a linked paste. */
  async findParsedSlotsByRegulation(regulationId: string): Promise<Array<{ parsedSlots: string }>> {
    return this.db
      .select({ parsedSlots: vgcPastes.parsedSlots })
      .from(vgcPasteTeams)
      .innerJoin(vgcPastes, eq(vgcPasteTeams.pasteId, vgcPastes.id))
      .where(eq(vgcPasteTeams.regulationId, regulationId));
  }
}
